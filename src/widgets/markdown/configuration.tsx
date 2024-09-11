import React, {memo} from 'react';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import ButtonSet from '@jetbrains/ring-ui-built/components/button-set/button-set';

import type {CustomWidgetAPILayer} from '../../../@types/globals';
import { WidgetConfiguration } from './types';


interface Props {
  onDone: (config?: WidgetConfiguration) => void;
}

const ConfigurationComponent: React.FunctionComponent<Props> = ({onDone}) => {
  const [value, setValue] = React.useState('');

  const onChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const onSubmit = React.useCallback(async (e: React.MouseEvent) => {
    if (!value) {
      return;
    }
    onDone({someValue: value});
  }, [value]);

  return (
    <form className="ring-form">
      <span className="ring-form__title">{'Widget configuration example'}</span>

      <Input label="Type some value" value={value} onChange={onChange}/>

      <ButtonSet className="config-buttons">
        <Button primary disabled={!value} onClick={onSubmit}>{'Save'}</Button>
        <Button onClick={() => onDone()}>{'Cancel'}</Button>
      </ButtonSet>
    </form>
  );
};

export const Configuration = memo(ConfigurationComponent);
