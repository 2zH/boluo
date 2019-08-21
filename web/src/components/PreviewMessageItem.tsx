import React, { useEffect, useRef, useState } from 'react';
import { PreviewMessage } from './Channel';
import { createStyles, ListItem, makeStyles, Typography } from '@material-ui/core';

const useStyles = makeStyles(() =>
  createStyles({
    preview: {
      backgroundColor: '#bdd8ff',
    },
    ooc: {
      width: '100%',
      fontSize: '90%',
      textAlign: 'right',
    },
    message: {},
  })
);

export interface Props {
  preview: PreviewMessage;
}

const KEEP_TIME = 7000;

export const PreviewMessageItem = ({ preview }: Props) => {
  const [show, setShow] = useState(true);
  const prevDate = useRef(preview.updateTime);
  useEffect(() => {
    const handler = window.setTimeout(() => {
      setShow(false);
    }, KEEP_TIME);
    return () => window.clearTimeout(handler);
  });
  const classes = useStyles();

  if (prevDate.current !== preview.updateTime) {
    setShow(true);
    prevDate.current = preview.updateTime;
  }
  if (!show) {
    return null;
  }
  let content = (
    <Typography className={preview.isOoc ? classes.ooc : ''}>
      <strong>{preview.charName}: </strong>
      {preview.content}
    </Typography>
  );

  if (preview.justTyping) {
    content = (
      <Typography>
        <strong>{preview.charName}</strong> is typing...
      </Typography>
    );
  }

  return <ListItem className={classes.preview}>{content}</ListItem>;
};
