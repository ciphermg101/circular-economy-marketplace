import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export interface AuthenticatedSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> {
  user: {
    id: string;
    email: string;
    role: string;
  };
} 