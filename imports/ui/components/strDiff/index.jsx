import React from 'react';
import {diffLines} from 'jdiff';
import { parseDiff, Diff, Hunk } from 'react-diff-view';
import 'react-diff-view/style/index.css';

export class StrDiff extends React.Component {
    render(){
        var oldStr = this.props.oldStr || '';
        var newStr = this.props.newStr || '';
        if(_.isObject(oldStr)){
            oldStr = JSON.stringify(oldStr, null, 2);
        }
        if(_.isObject(oldStr)){
            newStr = JSON.stringify(newStr, null, 2);
        }

        var diffText =  Diff.diffLines((oldStr, newStr), { context: 3 });
        var files = parseDiff(diffText);
        console.log('tasneem.....!!!!!' + oldStr, newStr);
        return (
            <div>
                {files.map(({oldRevision, newRevision, type, hunks})=>{
                    return <Diff key={oldRevision + '-' + newRevision} viewType="split" diffType={type} hunks={hunks}>
                        {hunks => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
                    </Diff>;
                })}
            </div>
        );
    }
}
