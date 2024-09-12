import React, {memo} from 'react';
import type {HostAPI} from '../../../@types/globals';
import {getRandomQuote} from './quotes-list';
import Heading from '@jetbrains/ring-ui-built/components/heading/heading';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Text from '@jetbrains/ring-ui-built/components/text/text';


interface Props {
  host: HostAPI
}

const QuotesComponent: React.FunctionComponent<Props> = () => {
  const [quote, setQuote] = React.useState(getRandomQuote());

  const changeQuote = React.useCallback(() => {
    setQuote(getRandomQuote());
  }, []);

  return (
    <div>
      <Heading>{quote[0]}{'\n'}<Text>© {quote[1]}</Text></Heading>
      <Button onClick={() => changeQuote()}>More wisdom</Button>
    </div>
  );
};

export const Quotes = memo(QuotesComponent);
