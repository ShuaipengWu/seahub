import React, {Component, Fragment} from 'react';
import ReactDOM from 'react-dom';
import { Utils } from '../../utils/utils';
import { gettext } from '../../utils/constants';
import Logo from '../../components/logo';
import Account from '../../components/common/account';
import FileUploader from './file-uploader';

import '../../css/upload-link.css';
import {Form, FormGroup, Input, Label} from 'reactstrap';
import PropTypes from "prop-types";

const loggedUser = window.app.pageOptions.username;
const {
  dirName,
  sharedBy,
  noQuota,
  maxUploadFileSize,
  token,
  repoID,
  path,
  format
} = window.uploadLink;

const inputWidth = Utils.isDesktop() ? 250 : 210;


const parameterItemPropTypes = {
  paramName: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired   // Sign: (index, value)
};

class ParameterItem extends Component {

  onContentChange = (e) => {
    this.props.onChange(this.props.index, e.target.value);
  }

  render() {
    let compId = 'format-input-' + this.props.index;
    return (
      <FormGroup>
        <Label for={compId} >{this.props.paramName}：</Label>
        <Input id={compId} onChange={this.onContentChange} style={{width: inputWidth}} type='text'/>
      </FormGroup>
    );
  }

}

ParameterItem.propTypes = parameterItemPropTypes;


class SharedUploadLink extends React.Component {

  constructor(props) {
    super(props);
    let paramCnt = Utils.getFormatParamCount(format);
    let paramArr = new Array(paramCnt);
    for (let i = 0; i < paramCnt; i++) paramArr[i] = '';
    this.state = {
      requiredFormatItems: format ? paramCnt : 0,
      formatParameters: paramArr,
      assembledFilename: null,
      parametersReady: !format
    };
  }

  onParamChange = (index, value) => {
    let paramArr = this.state.formatParameters;
    paramArr[index] = value;
    let isParametersAllOk = true;
    for (let i = 0; i < this.state.requiredFormatItems; i++) {
      if (paramArr[i].length === 0) {
        isParametersAllOk = false;
        break;
      }
    }
    let newAssembledFilename = null;
    if (isParametersAllOk) {
      newAssembledFilename = Utils.applyFormatParameters(format, this.state.formatParameters);
    }
    this.setState({formatParameters: paramArr,
      assembledFilename: newAssembledFilename, parametersReady: newAssembledFilename != null});
  }

  renderFormatInputGetter(format) {
    let parameters = Utils.getFormatParameters(format);
    return (
      <Form className="mb-4">
        {parameters.map((param, index) => {
          return (
            <ParameterItem
              key={index}
              paramName={param}
              index={index}
              onChange={this.onParamChange.bind(this)}
            />
          );
        })}
      </Form>
    );
  }

  render() {
    return (
      <div className="h-100 d-flex flex-column">
        <div className="top-header d-flex justify-content-between">
          <Logo />
          {loggedUser && <Account />}
        </div>
        <div className="o-auto">
          <div className="py-4 px-6 mx-auto rounded" id="upload-link-panel">
            <h3 className="h5" dangerouslySetInnerHTML={{__html: gettext('Upload files to {folder_name_placeholder}')
              .replace('{folder_name_placeholder}', `<span class="op-target">${Utils.HTMLescape(dirName)}</span>`)}}></h3>
            <p className="small shared-by" dangerouslySetInnerHTML={{__html: `${gettext('shared by:')} ${sharedBy.avatar} ${sharedBy.name}`}}></p>
            {noQuota ? (
              <div className="py-6 text-center">
                <span className="sf3-font sf3-font-tips warning-icon"></span>
                <p>{gettext('The owner of this library has run out of space.')}</p>
              </div>
            ) : (
              <Fragment>
                <ol className="small text-gray">
                  <li className="tip-list-item">{gettext('Folder upload is limited to Chrome, Firefox 50+, and Microsoft Edge.')}</li>
                  {maxUploadFileSize && <li className="tip-list-item">{gettext('File size should be smaller than {max_size_placeholder}').replace('{max_size_placeholder}', maxUploadFileSize)}</li>}
                  {format && <li className="tip-list-item">{gettext('Please input these information to form an upload filename.')}</li>}
                </ol>
                {format && this.renderFormatInputGetter(format)}
                {this.state.parametersReady ? (
                  <Fragment>
                    <div id="upload-link-drop-zone" className="text-center mt-2 mb-4">
                      <span className="sf3-font sf3-font-upload upload-icon"></span>
                      <p className="small text-gray mb-0">{gettext('Drag and drop files or folders here.')}</p>
                    </div>
                    <FileUploader
                      ref={uploader => this.uploader = uploader}
                      dragAndDrop={true}
                      token={token}
                      repoID={repoID}
                      path={path}
                      onFileUploadSuccess={() => {}}
                      filenameOverride={this.state.assembledFilename}
                    />
                  </Fragment>
                ) : (
                  <div className="py-6 text-center">
                    <span className="sf3-font sf3-font-tips warning-icon"></span>
                    <p>{gettext('Fill in all the blanks above to enable file upload.')}</p>
                  </div>
                )}
              </Fragment>
            )}
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <SharedUploadLink />,
  document.getElementById('wrapper')
);
