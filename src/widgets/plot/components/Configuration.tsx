import React, {memo, useCallback, useState} from 'react';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import ButtonSet from '@jetbrains/ring-ui-built/components/button-set/button-set';
import type {WidgetConfiguration} from '../utils/types.d.ts';

interface Props {
    onDone: (config?: WidgetConfiguration) => void;
    initialName?: string;
}

const ConfigurationComponent: React.FunctionComponent<Props> = ({onDone, initialName = ''}) => {
    const [name, setName] = useState(initialName);
    const trimmedName = name.trim();

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    }

    const onSubmit = (e?: React.SyntheticEvent) => {
        console.info("submitting start")
        e?.preventDefault();
        console.info("submitting after prevent default")
        if (!trimmedName) {
            return;
        }
        onDone({name: trimmedName});
    }

    return (
      <form className="ring-form" onSubmit={onSubmit}>
        <span className="ring-form__title">{'Widget configuration'}</span>

        <Input label="Your name" value={name} onChange={onChange} autoFocus/>

        <ButtonSet className="config-buttons">
          <Button primary onClick={onSubmit} disabled={!trimmedName}>{'Save'}</Button>
          <Button onClick={() => onDone()}>{'Cancel'}</Button>
        </ButtonSet>
      </form>
    );
};

export const Configuration = memo(ConfigurationComponent);
