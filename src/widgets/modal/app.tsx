import React, {memo} from 'react';
import type {HostAPI} from '../../../@types/globals';
import Heading from '@jetbrains/ring-ui-built/components/heading/heading';
import Button from '@jetbrains/ring-ui-built/components/button/button';

interface Props {
  host: HostAPI
}

const AppComponent: React.FunctionComponent<Props> = ({host}) => {
  const onCloseModal = React.useCallback(() => {
    host.collapse();
  }, [host]);

  return (
    <div>
      <Heading>Modal Widget</Heading>

      <Button onClick={onCloseModal}>Close modal</Button>
    </div>
  );
};

export const App = memo(AppComponent);
