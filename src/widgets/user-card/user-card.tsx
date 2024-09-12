import React, {memo} from 'react';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import Link from '@jetbrains/ring-ui-built/components/link/link';
import type {HostAPI} from '../../../@types/globals';

interface YouTrackUser {
  id: string;
  login: string;
  email: string;
}

interface Props {
  host: HostAPI
}

const UserCardComponent: React.FunctionComponent<Props> = ({host}) => {
  const [user, setUser] = React.useState<null | YouTrackUser>(null);

  React.useEffect(() => {
    host.fetchYouTrack<YouTrackUser>(`users/${YTApp.entity?.id}`, {query: {fields: 'id,login,email'}}).
      then(u => setUser(u));
  }, [host]);

  if (!user) {
    return <LoaderInline/>;
  }

  return (
    <div>
      <Link target="_blank" href={`mailto:${user.email}`}>Email {user.login}</Link>
    </div>
  );
};

export const UserCardApp = memo(UserCardComponent);
