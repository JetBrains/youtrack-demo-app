/* eslint-disable no-console */
import React, { memo, useState } from 'react';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import ButtonSet from '@jetbrains/ring-ui-built/components/button-set/button-set';
import type {WidgetConfiguration} from './types.d.ts';
import Text from '@jetbrains/ring-ui-built/components/text/text.js';
import Heading from '@jetbrains/ring-ui-built/components/heading/heading.js';

interface Props {
    onDone: (config?: WidgetConfiguration) => void;
    currentConfiguration?: WidgetConfiguration;
}

const ConfigurationComponent: React.FunctionComponent<Props> = ({onDone,  currentConfiguration }) => {
    const [config, setConfig] = useState<WidgetConfiguration>({
        title: currentConfiguration?.title ?? '',
        query: currentConfiguration?.query ?? '',
        binSize: currentConfiguration?.binSize ?? 15,
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
        <Heading level={Heading.Levels.H2}>Widget Configuration</Heading>
        <div className="ring-form__group">
          <Input
            label="Widget Title"
            name="title"
            value={config.title}
            onChange={onChange}
            autoFocus
          />
        </div>
        
        <div className="ring-form__group">
          <Input
            label="query"
            placeholder="has: work"
            name="query"
            value={config.query}
            onChange={onChange}
            />
        </div>

        <div className="ring-form__group">
          <Input
            label="bin size in minutes"
            placeholder="15"
            name="binSize"
            value={config.binSize}
            onChange={onChange}
          />
        </div>
        <div className="ring-form__group">
          <ButtonSet className="config-buttons">
            <Button primary onClick={onSubmit} disabled={false}>{'Save'}</Button>
            <Button onClick={() => onDone()}>{'Cancel'}</Button>
          </ButtonSet>
        </div>
      </form>
    );
};

const Configuration = memo(ConfigurationComponent);

export default Configuration;