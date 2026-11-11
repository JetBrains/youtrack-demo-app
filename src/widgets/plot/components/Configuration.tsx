import React, {memo, useCallback, useState} from 'react';
import QueryAssist, {
    type QueryAssistChange,
    type QueryAssistRequestParams,
    type QueryAssistResponse
} from '@jetbrains/ring-ui-built/components/query-assist/query-assist';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import ButtonSet from '@jetbrains/ring-ui-built/components/button-set/button-set';
import Text from '@jetbrains/ring-ui-built/components/text/text';
import {HostAPI} from "../../../../@types/globals";

const ChartConfiguration = ({ host, onDone }: { host: HostAPI }) => {
    const [query, setQuery] = useState("")
    const ASSIST_FIELDS = "caret,query,suggestions(caret,completionEnd,completionStart,description,group,matchingEnd,matchingStart,option)""

    const dataSource = useCallback(
        ({query: q, caret}: QueryAssistRequestParams): Promise<QueryAssistResponse> =>
            host.fetchYouTrack<QueryAssistResponse>(`search/assist?fields=${ASSIST_FIELDS}`, {
                method: 'POST',
                body: {query: q, caret}
            }),
        [host]
    );

    const onChange = useCallback((change: QueryAssistChange) => setQuery(change.query), []);

    const onSave = useCallback(() => {
        const trimmed = query.trim();
        if (trimmed) {
            onDone({query: trimmed});
        }
    }, [onDone, query]);

    return (
        <form className="ring-form" onSubmit={e => e.preventDefault()}>
            <Text>Search query for the issues whose work items are analyzed:</Text>
            <QueryAssist
                query={"has: work"}
                placeholder="Enter query to filter for specific items"
                dataSource={dataSource}
                onChange={onChange}
                onApply={onChange}
                focus
                clear
            />
            <ButtonSet className="config-buttons">
                <Button primary onClick={onSave}>Save</Button>
                <Button onClick={() => onDone()}>Cancel</Button>
            </ButtonSet>
        </form>
    );

}
export default ChartConfiguration