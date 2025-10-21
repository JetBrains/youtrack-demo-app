import React, {memo, useCallback} from 'react';
import {AppLocation, type HostAPI} from '../../../@types/globals';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Heading from '@jetbrains/ring-ui-built/components/heading/heading';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import Panel from '@jetbrains/ring-ui-built/components/panel/panel';
import Text from '@jetbrains/ring-ui-built/components/text/text';
import Group from '@jetbrains/ring-ui-built/components/group/group';


interface Props {
  host: HostAPI
}

const AppComponent: React.FunctionComponent<Props> = ({host}) => {
  const [val1, setVal1] = React.useState('');
  const [val2, setVal2] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [location, setLocation] = React.useState<AppLocation | null>(null);

  React.useEffect(() => {
    host.navigation?.getAppLocation().then(setLocation);

    host.fetchApp<{val1?: string, val2?: string}>('backend-global/demo', {query: {test: 'test'}}).
      then(persisted => {
        setVal1(persisted.val1 ?? '');
        setVal2(persisted.val2 ?? '');
      });
  }, [host]);

  const updateLocation = React.useCallback(() => {
    if (location) {
      host.navigation?.updateAppLocation(location);
    }
  }, [host, location]);

  React.useEffect(() => {
    window.addEventListener('appLocationChange', (event: Event) => {
      const customEvent = event as CustomEvent;
      setLocation(customEvent.detail);
    });
  }, [host]);

  const callBackend = useCallback(async () => {
    const result = await host.fetchApp('backend-global/demo', {method: 'POST', body: {val1, val2}});
    // eslint-disable-next-line no-console
    console.log('request result', result);
    setSuccess(true);
  }, [host, val1, val2]);

  return (
    <div className="widget">
      <Heading>{'This is a full-screen page'}</Heading>
      <form>
        <Heading level={3}>{'Here is a simple form example'}</Heading>

        <Input
          label="Labeled input"
          value={val1}
          onChange={(e) => setVal1(e.target.value)}
        />
        <Input
          name="login"
          label="Label and hint"
          placeholder="Hint"
          value={val2}
          onChange={(e) => setVal2(e.target.value)}
        />

        <Panel className="form-panel">
          <Group>
            <Button primary onClick={callBackend}>
              {'Save'}
            </Button>
            {success && <Text>{'Saved!'}</Text>}
          </Group>
        </Panel>
      </form>

      {location && (
        <article>
          <Heading>URL access example</Heading>
          <div>
            <Input
              label="Path"
              value={location?.pathname}
              onChange={(e) =>
                setLocation({...location, pathname: e.target.value})
              }
            />

            <Input
              label="Search"
              value={location?.search}
              onChange={(e) =>
                setLocation({...location, search: e.target.value})
              }
            />

            <Input
              label="Hash"
              value={location?.hash}
              onChange={(e) =>
                setLocation({...location, hash: e.target.value})
              }
            />

            <Panel className="form-panel">
              <Group>
                <Button primary type="button" onClick={updateLocation}>Update location</Button>
              </Group>
            </Panel>
          </div>
        </article>
      )}
    </div>
  );
};

export const App = memo(AppComponent);
