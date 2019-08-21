import React, { useState } from 'react';
import { Message } from './Channel';
import { createStyles, IconButton, ListItem, ListItemSecondaryAction, makeStyles, Typography } from '@material-ui/core';
import { useUserState } from '../user';
import RemoveIcon from '@material-ui/icons/Delete';
import { gql } from 'apollo-boost';
import { useMutation } from '@apollo/react-hooks';

const DELETE_MESSAGE = gql`
  mutation($id: String!) {
    deleteMessage(messageId: $id)
  }
`;

const useStyles = makeStyles(() =>
  createStyles({
    ooc: {
      width: '100%',
      fontSize: '90%',
      textAlign: 'right',
    },
    message: {},
  })
);

interface Props {
  message: Message;
}

const ME_REGEX = /[.。]me(?![a-zA-Z0-9_\-])/g;
const DICE_REGEX = /(\d{0,3})[dD](\d{0,3})/g;

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (): number => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export const MessageItem = ({ message }: Props) => {
  const userState = useUserState();
  const [removeMessage] = useMutation(DELETE_MESSAGE, { variables: { id: message.id } });
  const [removed, setRemoved] = useState(false);
  const classes = useStyles({});
  let name = 'Anonymous';
  if (message.user) {
    name = message.charName;
  }

  if (removed) {
    return null;
  }

  const rollReplacer = (_: string, a: string, b: string) => {
    const amount = parseInt(a || '1', 10);
    const face = parseInt(b, 10);
    const rnd = xmur3(message.id + message.created);

    const result = [...Array(amount).keys()].map(() => (rnd() % face) + 1);
    if (amount === 1) {
      return `[D${face}]=${result}`;
    }
    const sum = result.reduce((a, b) => a + b, 0);
    return `[${amount}D${face}=(${result})=${sum}]`;
  };

  const isAction = Boolean(message.content.match(ME_REGEX));

  const handleRemove = () => {
    removeMessage();
    setRemoved(true);
  };

  const removeButton = (
    <ListItemSecondaryAction>
      <IconButton edge="end" aria-label="remove" onClick={handleRemove}>
        <RemoveIcon />
      </IconButton>
    </ListItemSecondaryAction>
  );

  const content = message.content.replace(ME_REGEX, `[${message.charName}]`).replace(DICE_REGEX, rollReplacer);
  const className: string = message.isOoc ? classes.ooc : classes.message;
  return (
    <ListItem key={message.id}>
      <Typography className={className}>
        {!isAction ? <strong>{name}: </strong> : <small>({name}) </small>}
        <span>{content}</span>
      </Typography>
      {userState.type === 'user' && userState.id === message.userId ? removeButton : null}
    </ListItem>
  );
};
