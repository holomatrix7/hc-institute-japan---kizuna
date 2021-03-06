import { FUNCTIONS, ZOMES } from "../../../connection/types";
import { pushError } from "../../error/actions";
import { AgentProfile, Profile } from "../../profile/types";
import { ThunkAction } from "../../types";
import { SET_CONTACTS } from "../types";

const fetchMyContacts =
  (): ThunkAction =>
  async (dispatch, _getState, { callZome }) => {
    try {
      const ids = await callZome({
        zomeName: ZOMES.CONTACTS,
        fnName: FUNCTIONS[ZOMES.CONTACTS].LIST_ADDED,
      });

      let contacts: { [key: string]: Profile } = {};
      try {
        const profilesOutput = await callZome({
          zomeName: ZOMES.PROFILES,
          fnName: FUNCTIONS[ZOMES.PROFILES].GET_AGENTS_PROFILES,
          payload: ids,
        });
        profilesOutput.forEach((agentProfile: AgentProfile) => {
          const id = agentProfile.agent_pub_key;
          contacts[id] = {
            id,
            username: agentProfile.profile.nickname,
          };
        });
        dispatch({
          type: SET_CONTACTS,
          contacts,
        });
        return contacts;
      } catch (e) {
        dispatch(
          pushError(
            "TOAST",
            {},
            { id: "redux.err.contacts.fetch-my-contacts.1" }
          )
        );
      }
    } catch (e) {
      dispatch(pushError("TOAST", {}, { id: "redux.err.generic" }));
    }
    return null;
  };

export default fetchMyContacts;
