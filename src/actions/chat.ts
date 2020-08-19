import { Message } from '../api/messages';
import { ChannelEvent } from '../api/events';
import { Id } from '../utils/id';
import { Dispatch } from '../store';
import { get } from '../api/request';
import { throwErr } from '../utils/errors';
import { connect as apiConnect } from '../api/connect';
import { ChatState } from '../reducers/chat';
import { Map } from 'immutable';
import { initialChatItemSet } from '../states/chat-item-set';
import { showFlash } from './flash';

export interface CloseChat {
  type: 'CLOSE_CHAT';
  id: Id;
}

export interface LoadMessages {
  type: 'LOAD_MESSAGES';
  messages: Message[];
  finished: boolean;
}

export interface ChannelEventReceived {
  type: 'CHANNEL_EVENT_RECEIVED';
  event: ChannelEvent;
}

export interface ChatLoaded {
  type: 'CHAT_LOADED';
  chat: ChatState;
}

export interface ChatUpdate {
  type: 'CHAT_UPDATE';
  id: Id;
  chat: Partial<ChatState>;
}

let retry = 500;
let retryTimestamp = new Date().getTime();

function connect(dispatch: Dispatch, id: Id, eventAfter: number): WebSocket {
  const connection = apiConnect(id, 'CHANNEL', eventAfter);
  connection.onmessage = (wsMsg) => {
    const event = JSON.parse(wsMsg.data) as ChannelEvent;
    retryTimestamp = event.timestamp;
    dispatch({ type: 'CHANNEL_EVENT_RECEIVED', event });
  };
  connection.onopen = () => {
    retry = 500;
  };
  connection.onerror = (e) => {
    console.warn(e);
  };
  connection.onclose = (e) => {
    console.warn(e);
    dispatch(showFlash('ERROR', `连接出现错误，${retry / 1000} 秒后尝试重新连接`));
    setTimeout(() => {
      console.log(retry);
      retry *= 2;
      dispatch({ type: 'CHAT_UPDATE', id, chat: { connection: connect(dispatch, id, retryTimestamp) } });
    }, retry);
  };
  return connection;
}

export const loadChat = (id: Id) => async (dispatch: Dispatch) => {
  const result = await get('/channels/query_with_related', { id });
  if (result.isErr) {
    throwErr(dispatch)(result.value);
    return;
  }
  const { channel, members, colorList, heartbeatMap } = result.value;
  const messageBefore = new Date().getTime();
  const eventAfter = messageBefore - 24 * 60 * 60 * 1000;
  const connection = connect(dispatch, channel.id, eventAfter);
  const chat: ChatState = {
    colorMap: Map<Id, string>(Object.entries(colorList)),
    itemSet: initialChatItemSet,
    messageBefore,
    eventAfter,
    finished: false,
    heartbeatMap: Map(heartbeatMap),
    channel,
    connection,
    members,
    initialized: false,
    filter: 'NONE',
    memberList: false,
  };
  dispatch({ type: 'CHAT_LOADED', chat });
};

export interface ChatFilter {
  type: 'CHAT_FILTER';
  filter: ChatState['filter'];
}

export const chatNoneFilter: ChatFilter = { type: 'CHAT_FILTER', filter: 'NONE' };

export const chatInGameFilter: ChatFilter = { type: 'CHAT_FILTER', filter: 'IN_GAME' };

export const chatOutGameFilter: ChatFilter = { type: 'CHAT_FILTER', filter: 'OUT_GAME' };

export interface ToggleMemberList {
  type: 'TOGGLE_MEMBER_LIST';
}

export const toggleMemberList: ToggleMemberList = { type: 'TOGGLE_MEMBER_LIST' };

export interface StartEditMessage {
  type: 'START_EDIT_MESSAGE';
  message: Message;
}

export interface StopEditMessage {
  type: 'STOP_EDIT_MESSAGE';
  messageId: Id;
  editFor: number;
}

export interface MovingMessage {
  type: 'MOVING_MESSAGE';
  messageIndex: number;
  insertToIndex: number;
}

export interface ResetMessageMoving {
  type: 'RESET_MESSAGE_MOVING';
  messageId: Id;
}
