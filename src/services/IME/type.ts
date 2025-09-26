type RIME_COMMITTED = {
  state: 0;
  committed: string;
};
type RIME_ACCEPTED = {
  state: 1;
  committed?: string;
  head: string;
  body: string;
  tail: string;
  page: number;
  isLastPage: boolean;
  highlighted: number;
  selectLabels?: string[];
  candidates: {
    text: string;
    comment?: string;
  }[];
};
type RIME_REJECTED = {
  state: 2;
  updatedSchema?: string;
};
type RIME_UNHANDLED = {
  state: 3;
};
type RIME_UPDATED_OPTIONS = {
  updatedOptions?: string[];
};

export type RIME_RESULT = (RIME_COMMITTED | RIME_ACCEPTED | RIME_REJECTED | RIME_UNHANDLED) &
  RIME_UPDATED_OPTIONS;

type ControlMessageData = {
  type: 'control';
  name: string;
  args: any[];
};
type SuccessMessageData = {
  type: 'success';
  result: any;
  transferables: ArrayBuffer[];
};
type ErrorMessageData = {
  type: 'error';
  error: {
    name: string;
    message: string;
  };
};

export type MessageData = ControlMessageData | SuccessMessageData | ErrorMessageData;
