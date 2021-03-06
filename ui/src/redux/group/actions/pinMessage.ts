import { FUNCTIONS, ZOMES } from "../../../connection/types";
import { pushError } from "../../error/actions";
import { ThunkAction } from "../../types";
import { SetPinnedMessages, SET_PINNED_MESSAGES } from "../types";

export const pinMessage =
  (groupId: string, groupMessageId: string): ThunkAction =>
  async (dispatch, getState, { callZome }) => {
    try {
      await callZome({
        zomeName: ZOMES.GROUP,
        fnName: FUNCTIONS[ZOMES.GROUP].PIN_MESSAGE,
        payload: {
          groupHash: groupId,
          groupMessageHash: groupMessageId,
        },
      });
      const { conversation, pinnedMessages, message } = {
        ...{
          conversation: getState().groups.conversations[groupId],
          pinnedMessages: getState().groups.pinnedMessages,
          message: getState().groups.messages[groupMessageId],
        },
      };
      if (!message.replyTo) delete message["replyTo"];

      pinnedMessages[groupMessageId] = message;

      if (conversation.pinnedMessages)
        conversation.pinnedMessages!.push(groupMessageId);
      else conversation.pinnedMessages = [groupMessageId];

      dispatch<SetPinnedMessages>({
        type: SET_PINNED_MESSAGES,
        conversations: {
          ...getState().groups.conversations,
          [groupId]: conversation,
        },
        pinnedMessages: {
          ...getState().groups.pinnedMessages,
          ...pinnedMessages,
        },
      });
    } catch (e) {
      return dispatch(pushError("TOAST", {}, { id: "redux.err.generic" }));
    }
  };
