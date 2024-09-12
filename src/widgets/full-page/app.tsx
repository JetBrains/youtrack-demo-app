import React, {memo, useCallback} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Heading from '@jetbrains/ring-ui-built/components/heading/heading';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import Panel from '@jetbrains/ring-ui-built/components/panel/panel';
import Text from '@jetbrains/ring-ui-built/components/text/text';
import Group from '@jetbrains/ring-ui-built/components/group/group';
import type {HostAPI} from '../../../@types/globals';


interface Props {
  host: HostAPI
}

const AppComponent: React.FunctionComponent<Props> = ({host}) => {
  const [val1, setVal1] = React.useState('');
  const [val2, setVal2] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const callBackend = useCallback(async () => {
    const result = await host.fetchApp('backend-global/demo', {query: {val1, val2}});
    // eslint-disable-next-line no-console
    console.log('request result', result);
    setSuccess(true);
  }, [host, val1, val2]);

  return (
    <div className="widget">
      <Heading>
        {'This is a full-screen page'}
      </Heading>
      <form>
        <Heading level={3}>
          {'Here is a simple form example'}
        </Heading>

        <Input label="Labeled input" value={val1} onChange={e => setVal1(e.target.value)}/>
        <Input name="login" label="Label and hint" placeholder="Hint" value={val2} onChange={e => setVal2(e.target.value)}/>


        <Panel className="form-panel">
          <Group>
            <Button primary onClick={callBackend}>{'Save'}</Button>
            {success && <Text>{'Saved!'}</Text>}
          </Group>
        </Panel>
      </form>
    </div>
  );
};

export const App = memo(AppComponent);
