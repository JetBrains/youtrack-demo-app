import React, {memo, useCallback, useState} from 'react';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import ButtonSet from '@jetbrains/ring-ui-built/components/button-set/button-set';
import type {WidgetConfiguration} from '../utils/types.d.ts';

interface Props {
    onDone: (config?: WidgetConfiguration) => void;
    currentConfiguration?: WidgetConfiguration;
}

const ConfigurationComponent: React.FunctionComponent<Props> = ({onDone,  currentConfiguration }) => {
    const [config, setConfig] = useState<WidgetConfiguration>({
        title: currentConfiguration?.title ?? '',
        query: currentConfiguration?.query ?? ''
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig({
            ...config,
            [e.target.name]: e.target.value
        });
    }

    const onSubmit = (e?: React.SyntheticEvent) => {
        console.info("submitting start")
        e?.preventDefault();
        console.info("submitting after prevent default")
        onDone(config);
    }

    return (
      <form className="ring-form" onSubmit={onSubmit}>
        <span className="ring-form__title">{'Widget configuration'}</span>

        <Input
          label="Widget Title"
          name="title"
          value={config.title}
          onChange={onChange}
          autoFocus
        />

        <Input
          label="query"
          name="query"
          value={config.query}
          onChange={onChange}
        />

        <ButtonSet className="config-buttons">
          <Button primary onClick={onSubmit} disabled={false}>{'Save'}</Button>
          <Button onClick={() => onDone()}>{'Cancel'}</Button>
        </ButtonSet>
      </form>
    );
};

export const Configuration = memo(ConfigurationComponent);
