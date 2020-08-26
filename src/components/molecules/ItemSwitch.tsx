import * as React from 'react';
import ChatPreviewCompose from './ChatPreviewCompose';
import ChatMessageItem from './ChatMessageItem';
import ChatPreviewItem from './ChatPreviewItem';
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';
import { useSelector } from '../../store';
import { ChannelMember } from '../../api/channels';
import { EditItem, MessageItem, PreviewItem } from '../../states/chat-item-set';

interface Props {
  item: MessageItem | PreviewItem | undefined;
  editItem?: EditItem;
  myMember?: ChannelMember;
  handleProps?: DraggableProvidedDragHandleProps;
}

function ItemSwitch({ item, myMember, editItem, handleProps }: Props) {
  const myId = myMember?.userId;
  const filter = useSelector((state) => state.chat!.filter);
  const inGame = filter === 'IN_GAME';
  const outGame = filter === 'OUT_GAME';

  if (item === undefined) {
    if (myId === undefined) {
      throw new Error(`unexpected item index.`);
    }
    return <ChatPreviewCompose preview={undefined} key={myId} />;
  } else if (item.type === 'MESSAGE') {
    const { message } = item;
    if ((inGame && !message.inGame) || (outGame && message.inGame)) {
      return null;
    }
    if (editItem !== undefined) {
      if (editItem.mine && myId) {
        return <ChatPreviewCompose preview={editItem.preview} editTo={message} />;
      } else if (editItem.preview !== undefined) {
        return <ChatPreviewItem preview={editItem.preview} />;
      }
    }
    return (
      <ChatMessageItem
        message={message}
        mine={item.mine}
        myMember={myMember}
        handleProps={handleProps}
        moving={item.moving}
      />
    );
  } else {
    // preview
    if (item.mine && myId) {
      return <ChatPreviewCompose key={item.id} preview={item.preview} />;
    } else if ((inGame && !item.preview.inGame) || (outGame && item.preview.inGame)) {
      return null;
    } else {
      return <ChatPreviewItem key={item.id} preview={item.preview} />;
    }
  }
}

export default React.memo(ItemSwitch);
