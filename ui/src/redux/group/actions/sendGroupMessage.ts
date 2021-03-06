import { deserializeHash, serializeHash } from "@holochain-open-dev/core-types";
import { FUNCTIONS, ZOMES } from "../../../connection/types";
import { timestampToDate } from "../../../utils/helpers";
import {
  FilePayload,
  FileType,
  isImage,
  isOther,
  // type guards
  isTextPayload,
  Payload,
} from "../../commons/types";
import { pushError } from "../../error/actions";
import { ThunkAction } from "../../types";
import { setFilesBytes } from "../actions";
import {
  GroupConversation,
  GroupMessage,
  // IO
  GroupMessageInput,
  // action payload types
  SetGroupMessageAction,
  // action types
  SET_GROUP_MESSAGE,
} from "../types";

const sendGroupMessage =
  (groupMessageData: GroupMessageInput): ThunkAction =>
  async (dispatch, getState, { callZome }): Promise<GroupMessage | false> => {
    if (isTextPayload(groupMessageData.payloadInput)) {
      let message = groupMessageData.payloadInput.payload.payload;
      /* input sanitization for text payload */
      groupMessageData.payloadInput.payload = { payload: message.trim() };
    }

    /* deserialize fields for zome fn */
    const input = {
      groupHash: deserializeHash(groupMessageData.groupId),
      payloadInput: groupMessageData.payloadInput,
      sender: deserializeHash(groupMessageData.sender),
      replyTo: groupMessageData.replyTo
        ? deserializeHash(groupMessageData.replyTo)
        : undefined,
    };

    const state = getState();

    try {
      const sendGroupMessageOutput = await callZome({
        zomeName: ZOMES.GROUP,
        fnName: FUNCTIONS[ZOMES.GROUP].SEND_MESSAGE,
        payload: input,
      });

      let payload: Payload;
      let fileBytes: Uint8Array | undefined;

      /* convert the payload returned from HC to UI appropriate payload type */
      if (isTextPayload(groupMessageData.payloadInput)) {
        payload = sendGroupMessageOutput.content.payload;
      } else {
        let fileType: FileType =
          sendGroupMessageOutput.content.payload.payload.fileType;
        /* set the thumbnail if the file type is either a media or video */
        let thumbnail: Uint8Array | undefined = isOther(fileType)
          ? undefined
          : isImage(fileType)
          ? fileType.payload.thumbnail
          : fileType.payload.thumbnail;
        fileBytes = groupMessageData.payloadInput.payload.fileBytes;
        if (fileType.type === "VIDEO") {
          const fetchedFileBytes = await callZome({
            zomeName: ZOMES.GROUP,
            fnName: FUNCTIONS[ZOMES.GROUP].GET_FILES_BYTES,
            payload: [
              sendGroupMessageOutput.content.payload.payload.metadata.fileHash,
            ],
          });

          if (fetchedFileBytes?.type !== "error") {
            dispatch(setFilesBytes({ ...fetchedFileBytes }));
          }
        }
        const filePayload: FilePayload = {
          type: "FILE",
          fileName:
            sendGroupMessageOutput.content.payload.payload.metadata.fileName,
          fileSize:
            sendGroupMessageOutput.content.payload.payload.metadata.fileSize,
          fileType:
            sendGroupMessageOutput.content.payload.payload.metadata.fileType,
          fileHash: serializeHash(
            sendGroupMessageOutput.content.payload.payload.metadata.fileHash
          ),
          thumbnail,
        };
        payload = filePayload;
      }
      const message = sendGroupMessageOutput.content.replyTo
        ? getState().groups.messages[
            serializeHash(sendGroupMessageOutput.content.replyTo)
          ]
        : null;

      /* the final GroupMessage data type converted from the returned value of the Zome fn above */
      const groupMessageDataConverted: GroupMessage = {
        groupMessageId: serializeHash(sendGroupMessageOutput.id),
        groupId: serializeHash(sendGroupMessageOutput.content.groupHash),
        author: serializeHash(sendGroupMessageOutput.content.sender),
        payload,
        timestamp: timestampToDate(sendGroupMessageOutput.content.created),
        replyTo: message
          ? {
              groupId: message.groupId,
              author: message.author,
              payload: message.payload,
              timestamp: message.timestamp,
              /*
                TODO: currently undefined but we will have to modify this once jumping
                to replied message will be possible.
              */
              replyTo: undefined,
              readList: {},
            }
          : undefined,
        readList: {},
      };

      const groupId: string = groupMessageDataConverted.groupId;
      const groupMessageId: string = groupMessageDataConverted.groupMessageId;
      const groupConversation = state.groups.conversations[groupId];

      const messageIds = [
        groupMessageDataConverted.groupMessageId,
        ...groupConversation.messages,
      ];
      const newMessage: { [key: string]: GroupMessage } = {
        [groupMessageId]: groupMessageDataConverted,
      };
      let messages = state.groups.messages;
      messages = {
        ...messages,
        ...newMessage,
      };

      let groupFiles = state.groups.groupFiles;
      if (!isTextPayload(groupMessageDataConverted.payload)) {
        // work with file payload
        const newFile: { [key: string]: Uint8Array } = {
          [groupMessageDataConverted.payload.fileHash]: fileBytes!,
        };
        groupFiles = {
          ...groupFiles,
          ...newFile,
        };
      }

      const conversations: {
        [key: string]: GroupConversation;
      } = {
        ...state.groups.conversations,
        [groupId]: { ...groupConversation, messages: messageIds },
      };

      dispatch<SetGroupMessageAction>({
        type: SET_GROUP_MESSAGE,
        conversations,
        messages,
        groupFiles,
      });

      return groupMessageDataConverted;
    } catch (e) {
      if (e.message.includes("failed to get the given group id")) {
        dispatch(
          pushError(
            "TOAST",
            {},
            {
              id: "redux.err.group.send-group-message.1",
              value: {
                payload: isTextPayload(groupMessageData.payloadInput)
                  ? groupMessageData.payloadInput.payload
                  : groupMessageData.payloadInput.payload.metadata.fileName,
              },
            }
          )
        );
      } else {
        /* 
          This is the error other than what we defiend in Guest.
          See connection/holochainClient.ts callZome() for more info.
        */
        dispatch(pushError("TOAST", {}, { id: "redux.err.generic" }));
      }
    }
    return false;
  };

export default sendGroupMessage;
