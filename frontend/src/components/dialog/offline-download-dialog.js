import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Alert } from 'reactstrap';
import { Utils } from '../../utils/utils';
import { seafileAPI } from '../../utils/seafile-api.js';
import { gettext, siteRoot } from '../../utils/constants';

const propTypes = {
  repoID: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  toggleDialog: PropTypes.func.isRequired,
  refreshDirent: PropTypes.func.isRequired
};

// We cannot modify the seafile-API lib, but we can add a raw method.
function getOfflineDownloadTask() {
  let url = seafileAPI.server + '/api/v2.2/offline-download/tasks/';
  return seafileAPI.req.get(url, { });
}
function addOfflineDownloadTask(repoId, path, targetUrl) {
  let url = seafileAPI.server + '/api/v2.2/offline-download/add/';
  return seafileAPI.req.put(url, { repo_id: repoId, path: path, url: targetUrl });
}

class OfflineDownloadDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isSubmitDisabled: true,
      q: '',
      errMessage: '',
      taskList: [],
      ent_ongoing_num: 0,
      refreshTimer: null
    };
  }

  refreshList() {
    getOfflineDownloadTask().then((res) => {
      this.setState({
        taskList: res.data.data,
        errMessage: ''
      });
      let ent_ongoing_cnt = 0;
      for (let i = 0; i < this.state.taskList.length; i++) {
        let is_not_ok = this.state.taskList[i].status === Utils.offlineDownloadStatus.WAITING ||
            this.state.taskList[i].status === Utils.offlineDownloadStatus.QUEUING ||
            this.state.taskList[i].status === Utils.offlineDownloadStatus.DOWNLOADING;
        if (is_not_ok) ent_ongoing_cnt++;
      }
      if (ent_ongoing_cnt < this.state.ent_ongoing_num) this.props.refreshDirent();
      this.setState({ ent_ongoing_num: ent_ongoing_cnt });
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      this.setState({
        errMessage: errMessage
      });
    });
  }

  intervalRefreshList() {
    if (this.state.ent_ongoing_num > 0) this.refreshList();
  }

  componentDidMount() {
    this.refreshList();
    this.setState({ refreshTimer: setInterval(this.intervalRefreshList.bind(this), 3000) });
  }

  componentWillUnmount() {
    clearInterval(this.state.refreshTimer);
    this.setState({ refreshTimer: null });
  }

  addTask = () => {
    const { q } = this.state;
    if (!q.trim()) {
      return false;
    }
    addOfflineDownloadTask(this.props.repoID, this.props.path, q).then((res) => {
      this.setState({ q: '' });
      this.refreshList();
    }).catch(error => {
      let errMessage = Utils.getErrorMsg(error);
      this.setState({
        errMessage: errMessage
      });
    });
  }

  toggle = () => {
    this.props.toggleDialog();
  }

  handleInputChange = (e) => {
    const q = e.target.value;
    this.setState({
      q: q,
      isSubmitDisabled: !q.trim()
    });
  }

  render() {
    const { q, errMessage, taskList, isSubmitDisabled } = this.state;
    return (
      <Modal isOpen={true} style={{maxWidth: '760px'}} toggle={this.toggle}>
        <ModalHeader toggle={this.toggle}>{gettext('Offline Upload')}</ModalHeader>
        <ModalBody style={{height: '350px'}} className="o-auto">
          <div className="d-flex">
            <input className="form-control mr-2" type="text" placeholder={gettext('Provide a file url or torrent')} value={q} onChange={this.handleInputChange}  />
            <button type="submit" className="btn btn-primary flex-shrink-0" onClick={this.addTask} disabled={isSubmitDisabled}>{gettext('Add')}</button>
          </div>
          {errMessage && <Alert color="danger" className="mt-2">{errMessage}</Alert>}
          <div className="mt-2">
            {taskList.length > 0 &&
            <table className="table-hover">
              <thead>
                <tr>
                  <th>Url</th>
                  <th width="17%">{gettext('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {taskList.map((item, index) => {
                  let stateStr = Utils.offlineDownloadStatus.toDisplayText(item.status);
                  return (
                    <TaskItem
                      key={index}
                      url={item.url}
                      status={stateStr}
                    />
                  );
                })}
              </tbody>
            </table>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.toggle}>{gettext('Close')}</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

OfflineDownloadDialog.propTypes = propTypes;

const TaskItemPropTypes = {
  url: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
};

class TaskItem extends React.PureComponent {

  render() {
    const { url, status } = this.props;

    return(
      <tr>
        <td>{url}</td>
        <td>{status}</td>
      </tr>
    );
  }
}

TaskItem.propTypes = TaskItemPropTypes;


export default OfflineDownloadDialog;
