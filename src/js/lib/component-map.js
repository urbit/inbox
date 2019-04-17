import { InboxPage } from '/components/inbox';
import { ChatPage } from '/components/stream/chat';
import { TopicCreatePage } from '/components/collection/createTopic';
import { CommentCreate } from '/components/collection/comment';
import { Elapsed } from '/components/lib/elapsed';
import { IconComment } from '/components/lib/icons/icon-comment';
import { Sigil } from '/components/lib/icons/sigil';
import { ChatList } from '/components/lib/chat-list';
import { ProfileMsgBtn } from '/components/lib/profile-msg-btn';
import { QRCodeComponent } from '/components/lib/qrcode';

export var ComponentMap = {
  "ChatPage": ChatPage,
  "ChatList": ChatList,
  "TopicCreatePage": TopicCreatePage,
  "CommentCreate": CommentCreate,
  "InboxPage": InboxPage,
  "Elapsed": Elapsed,
  "IconComment": IconComment,
  "Sigil": Sigil,
  "ProfileMsgBtn": ProfileMsgBtn,
  "QRCodeComponent": QRCodeComponent
};
