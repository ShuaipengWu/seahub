import React from 'react';
import ReactDOM from "react-dom";
import PropTypes from 'prop-types';
import Select from 'react-select';
import { Button, Modal, ModalHeader, Input, ModalBody, ModalFooter, Form, FormGroup, Label, Alert } from 'reactstrap';
import { gettext, enableEncryptedLibrary, repoPasswordMinLength, storages, libraryTemplates } from '../../utils/constants';

const propTypes = {
  libraryType: PropTypes.string.isRequired,
  onCreateRepo: PropTypes.func.isRequired,
  onCreateToggle: PropTypes.func.isRequired,
};

class CreateRepoDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '', // input中的值
      list: ['lisi', 'xiaohong'],
      repoName: '',
      disabled1: true,
      disabled2: true,
      disabled3: true,
      encrypt: false,
      password1: '',
      password2: '',
      standardize: false,
      hint: '',
      size: 0,
      unit: 'kb',
      errMessage: '',
      permission: 'rw',
      storage_id: storages.length ? storages[0].id : '',
      library_template: libraryTemplates.length ? libraryTemplates[0] : '',
      isSubmitBtnActive: false,
    };
    this.newInput = React.createRef();
  }

  handleRepoNameChange = (e) => {
    if (!e.target.value.trim()) {
      this.setState({isSubmitBtnActive: false});
    } else {
      this.setState({isSubmitBtnActive: true});
    }

    this.setState({repoName: e.target.value});
  }

  handlePassword1Change = (e) => {
    this.setState({password1: e.target.value});
  }

  handlePassword2Change = (e) => {
    this.setState({password2: e.target.value});
  }

  handleSizeChange = (e) => {
    this.setState({size: e.target.value});
  }

  handleSelectChange = (e) => {
    this.setState({unit: e.target.value});
  }

  handleSubmit = () => {
    let isValid = this.validateInputParams();
    if (isValid) {
      let repoData = this.prepareRepoData();
      if (this.props.libraryType === 'department') {
        this.props.onCreateRepo(repoData, 'department');
        return;
      }
      this.props.onCreateRepo(repoData);
    }
  }

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleSubmit();
      e.preventDefault();
    }
  }

  toggle = () => {
    this.props.onCreateToggle();
  }

  componentDidMount() {
    this.newInput.focus();
  }

  validateInputParams() {
    let errMessage = '';
    let repoName = this.state.repoName.trim();
    if (!repoName.length) {
      errMessage = gettext('Name is required');
      this.setState({errMessage: errMessage});
      return false;
    }
    if (repoName.indexOf('/') > -1) {
      errMessage = gettext('Name should not include \'/\'.');
      this.setState({errMessage: errMessage});
      return false;
    }
    if (this.state.encrypt) {
      let password1 = this.state.password1.trim();
      let password2 = this.state.password2.trim();
      if (!password1.length) {
        errMessage = gettext('Please enter password');
        this.setState({errMessage: errMessage});
        return false;
      }
      if (!password2.length) {
        errMessage = gettext('Please enter the password again');
        this.setState({errMessage: errMessage});
        return false;
      }
      if (password1.length < repoPasswordMinLength) {
        errMessage = gettext('Password is too short');
        this.setState({errMessage: errMessage});
        return false;
      }
      if (password1 !== password2) {
        errMessage = gettext('Passwords don\'t match');
        this.setState({errMessage: errMessage});
        return false;
      }
    }
    return true;
  }

  onPermissionChange = (e) => {
    let permission = e.target.value;
    this.setState({permission: permission});
  }

  handleStorageInputChange = (selectedItem) => {
    this.setState({storage_id: selectedItem.value});
  }

  handlelibraryTemplatesInputChange = (selectedItem) => {
    this.setState({library_template: selectedItem.value});
  }

  onEncrypted = (e) => {
    let isChecked = e.target.checked;
    this.setState({
      encrypt: isChecked,
      disabled1: !isChecked
    });
  }

  onStandardized = (e) => {
    let isChecked = e.target.checked;
    this.setState({
      standardize: isChecked,
      disabled2: !isChecked
    });
  }

  onSized = (e) => {
    let isChecked = e.target.checked;
    this.setState({
      standardize: isChecked,
      disabled3: !isChecked
    });
  }

  prepareRepoData = () => {
    let libraryType = this.props.libraryType;

    let repoName = this.state.repoName.trim();
    let password = this.state.encrypt ? this.state.password1 : '';
    let permission = this.state.permission;

    let repo = null;
    if (libraryType === 'mine' || libraryType === 'public') {
      repo = {
        name: repoName,
        passwd: password
      };
    }
    if (libraryType === 'group') {
      repo = {
        repo_name: repoName,
        password: password,
        permission: permission,
      };
    }
    if (libraryType === 'department') {
      repo = {
        repo_name: repoName,
        passwd: password,
      };
    }

    const storage_id = this.state.storage_id;
    if (storage_id) {
      repo.storage_id = storage_id;
    }

    const library_template = this.state.library_template;
    if (library_template) {
      repo.library_template = library_template;
    }

    return repo;
  }

  hintListChange(e) {
    this.setState({
        inputValue: e.target.value
    })
  }

  addList = () => {
    this.setState({
        inputValue: '',
        list: [...this.state.list, this.state.inputValue]
    })
  }

  deleteItem = (index) => {
    let list = this.state.list;
    list.splice(index, 1);
    this.setState({
        list: list
    })
  }

  render() {
    return (
      <Modal isOpen={true} toggle={this.toggle}>
        <ModalHeader toggle={this.toggle}>{gettext('New Library')}</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="repoName">{gettext('Name')}</Label>
              <Input
                id="repoName"
                onKeyPress={this.handleKeyPress}
                innerRef={input => {this.newInput = input;}}
                value={this.state.repoName}
                onChange={this.handleRepoNameChange}
              />
            </FormGroup>

            {libraryTemplates.length > 0 && (
              <FormGroup>
                <Label for="library-template">{gettext('Template')}</Label>
                <Select
                  id="library-template"
                  defaultValue={{value: libraryTemplates[0], label: libraryTemplates[0]}}
                  options={libraryTemplates.map((item, index) => { return {value: item, label: item}; })}
                  onChange={this.handlelibraryTemplatesInputChange}
                /> 
              </FormGroup>
            )}

            {storages.length > 0 && (
              <FormGroup>
                <Label for="storage-backend">{gettext('Storage Backend')}</Label>
                <Select
                  id="storage-backend"
                  defaultValue={{value: storages[0].id, label: storages[0].name}}
                  options={storages.map((item, index) => { return {value: item.id, label: item.name}; })}
                  onChange={this.handleStorageInputChange}
                />
              </FormGroup>
            )}

            {this.props.libraryType === 'group' && (
              <FormGroup>
                <Label for="exampleSelect">{gettext('Permission')}</Label>
                <Input type="select" name="select" id="exampleSelect" onChange={this.onPermissionChange} value={this.state.permission}>
                  <option value='rw'>{gettext('Read-Write')}</option>
                  <option value='r'>{gettext('Read-Only')}</option>
                </Input>
              </FormGroup>
            )}
            {enableEncryptedLibrary &&
              <div>
                <FormGroup check>
                  <Input type="checkbox" id="encrypt" onChange={this.onEncrypted} />
                  <Label for="encrypt">{gettext('Encrypt')}</Label>

                  <Input type="checkbox" id="standardize" onChange={this.onStandardized} />
                  <Label for="standardize">{gettext('Standardize')}</Label>
                </FormGroup>
                {!this.state.disabled1 &&
                  <FormGroup>
                    {/* todo translate */}
                    <Label for="passwd1">{gettext('Password')}</Label><span className="tip">{' '}{gettext('(at least {placeholder} characters)').replace('{placeholder}', repoPasswordMinLength)}</span>
                    <Input
                      id="passwd1"
                      type="password"
                      disabled={this.state.disabled1}
                      value={this.state.password1}
                      onChange={this.handlePassword1Change}
                      autoComplete="new-password"
                    />
                  </FormGroup>
                }
                {!this.state.disabled1 &&
                  <FormGroup>
                    <Label for="passwd2">{gettext('Password again')}</Label>
                    <Input
                      id="passwd2"
                      type="password"
                      disabled={this.state.disabled1}
                      value={this.state.password2}
                      onChange={this.handlePassword2Change}
                      autoComplete="new-password"
                    />
                  </FormGroup>
                }
                {!this.state.disabled2 &&
                  <FormGroup>
                    <Label for="hint">{gettext('Add named hint')}</Label><span className="tip">{' '}{gettext('The name of this database file will be made up of "-" connection according to the hint')}</span>
                    <Input
                      id="hint"
                      type="text"
                      disabled={this.state.disabled2}
                      value={this.state.inputValue}
                      onChange={this.hintListChange}
                      autoComplete="off"
                    />
                    <button onClick={this.addList.bind(this)}>{gettext('Add the hint')}</button>
                    <ul>
                      {
                          this.state.list.map((item, index) => {
                              return <li key={index} onClick={this.deleteItem.bind(this, index)}>{item}</li>
                          })
                      }
                    </ul>
                    <div>
                      {
                        this.state.list.join("-")
                      }
                    </div>
                  </FormGroup>
                }
                {!this.state.disabled3 &&
                  <FormGroup>
                    <Label for="sized">{gettext('Limit upload file size')}</Label>
                    <Input
                      id="sized"
                      type="number"
                      disabled={this.state.disabled3}
                      value={this.state.size}
                      onChange={this.handleSizeChange}
                      autoComplete="off"
                    />
                    <Select
                      id="unit"
                      value={age}
                      onChange={handleSelectChange}
                    >
                      <MenuItem value={kb}>KB</MenuItem>
                      <MenuItem value={mb}>MB</MenuItem>
                    </Select>
                  </FormGroup>
                }
              </div>
            }
          </Form>
          {this.state.errMessage && <Alert color="danger">{this.state.errMessage}</Alert>}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle}>{gettext('Cancel')}</Button>
          <Button color="primary" onClick={this.handleSubmit} disabled={!this.state.isSubmitBtnActive}>{gettext('Submit')}</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

CreateRepoDialog.propTypes = propTypes;

export default CreateRepoDialog;
