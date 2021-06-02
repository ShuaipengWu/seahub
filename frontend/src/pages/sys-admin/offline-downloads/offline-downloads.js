import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { seafileAPI } from '../../../utils/seafile-api';
import { gettext } from '../../../utils/constants';
import { Utils } from '../../../utils/utils';
import toaster from '../../../components/toast';
import Loading from '../../../components/loading';
import Paginator from '../../../components/paginator';
import MainPanelTopbar from '../main-panel-topbar';

function getAllOfflineDownloadTask(page, perPage) {
  let url = seafileAPI.server + '/api/v2.2/admin/offline-downloads/';
  var params = {
    page: page,
    per_page: perPage
  };
  return seafileAPI.req.get(url, { params: params });
}

const DetailedOfflineDownloadItemPropTypes = {
  offlineDownloadItem: PropTypes.object.isRequired
};

class DetailedOfflineDownloadItem extends Component {

  constructor(props) {
    super(props);
    this.state = {
      highlight: false,
      showAllPath: false,
      showAllUrl: false
    };
  }

  handleMouseEnter = () => {
    this.setState({
      highlight: true
    });
  }

  handleMouseLeave = () => {
    this.setState({
      highlight: false
    });
  }

  onPathClick = () => {
    this.setState({
      showAllPath: true
    });
  }

  onUrlClick = () => {
    this.setState({
      showAllUrl: true
    });
  }

  render() {
    const taskInfo = this.props.offlineDownloadItem;
    let stateStr = Utils.offlineDownloadStatus.toDisplayText(taskInfo.status);

    let shortenUrl;
    if (taskInfo.url.length > 35)
      shortenUrl = taskInfo.url.substring(0, 30) + '.....';
    else
      shortenUrl = taskInfo.url;

    let shortenPath;
    if (taskInfo.file_path.length > 15)
      shortenPath = taskInfo.file_path.substring(0, 10) + '.....';
    else
      shortenPath = taskInfo.file_path;

    return (
      <tr className={this.state.highlight ? 'tr-highlight' : ''} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
        <td>{taskInfo.task_owner}</td>
        <td>{taskInfo.repo_name}</td>
        <td>{taskInfo.repo_owner}</td>
        <td onClick={this.onPathClick} title={taskInfo.file_path}>{taskInfo.status === Utils.offlineDownloadStatus.OK ?
          (this.state.showAllPath ? taskInfo.file_path : shortenPath) : '-'}</td>
        <td onClick={this.onUrlClick} title={taskInfo.url}>{this.state.showAllUrl ? taskInfo.url : shortenUrl}</td>
        <td>{taskInfo.status === Utils.offlineDownloadStatus.OK ? `${Utils.bytesToSize(taskInfo.size)}` : '-'}</td>
        <td>{stateStr}</td>
      </tr>
    );
  }
}

DetailedOfflineDownloadItem.propTypes = DetailedOfflineDownloadItemPropTypes;


const DetailedOfflineDownloadListPropTypes = {
  loading: PropTypes.bool.isRequired,
  errorMsg: PropTypes.string.isRequired,
  detailedOfflineDownloadList: PropTypes.array.isRequired,
  currentPage: PropTypes.number.isRequired,
  hasNextPage: PropTypes.bool.isRequired,
  curPerPage: PropTypes.number.isRequired,
  resetPerPage: PropTypes.func.isRequired,
  getListByPage: PropTypes.func.isRequired
};

class Content extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  getPreviousPage = () => {
    this.props.getListByPage(this.props.currentPage - 1);
  }

  getNextPage = () => {
    this.props.getListByPage(this.props.currentPage + 1);
  }

  render() {
    const {
      loading, errorMsg, detailedOfflineDownloadList,
      curPerPage, hasNextPage, currentPage
    } = this.props;

    if (loading) {
      return <Loading />;
    } else if (errorMsg) {
      return <p className="error text-center mt-4">{errorMsg}</p>;
    } else {
      return (
        <Fragment>
          <table>
            <thead>
              <tr>
                <th width="25%">{gettext('Task owner')}</th>
                <th width="22%">{gettext('Library')}</th>
                <th width="25%">{gettext('Repo owner')}</th>
                <th width="25%">{gettext('Path')}</th>
                <th width="45%">Url</th>
                <th width="14%">{gettext('Size')}</th>
                <th width="14%">{gettext('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {detailedOfflineDownloadList.map((offlineDownloadItem, index) => {
                return (
                  <DetailedOfflineDownloadItem
                    key={index}
                    offlineDownloadItem={offlineDownloadItem}
                  />
                );
              })}
            </tbody>
          </table>
          {detailedOfflineDownloadList.length > 0 &&
          <Paginator
            gotoPreviousPage={this.getPreviousPage}
            gotoNextPage={this.getNextPage}
            currentPage={currentPage}
            hasNextPage={hasNextPage}
            curPerPage={curPerPage}
            resetPerPage={this.props.resetPerPage}
          />
          }
        </Fragment>
      );
    }
  }
}

Content.propTypes = DetailedOfflineDownloadListPropTypes;


class DetailedOfflineDownloads extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      errorMsg: '',
      offlineDownloadTasks: [],
      currentPage: 1,
      perPage: 25,
      hasNextPage: false
    };
  }

  componentDidMount() {
    let urlParams = (new URL(window.location)).searchParams;
    const {
      currentPage, perPage
    } = this.state;
    this.setState({
      perPage: parseInt(urlParams.get('per_page') || perPage),
      currentPage: parseInt(urlParams.get('page') || currentPage)
    }, () => {
      this.getListByPage(this.state.currentPage);
    });
  }

  getListByPage = (page) => {
    const { perPage } = this.state;
    getAllOfflineDownloadTask(page, perPage).then((res) => {
      const data = res.data;
      this.setState({
        loading: false,
        currentPage: page,
        offlineDownloadTasks: data.task_list,
        hasNextPage: data.has_next_page
      });
    }).catch((error) => {
      this.setState({
        loading: false,
        errorMsg: Utils.getErrorMsg(error, true) // true: show login tip if 403
      });
    });
  }

  resetPerPage = (perPage) => {
    this.setState({
      perPage: perPage
    }, () => {
      this.getListByPage(1);
    });
  }

  render() {
    return (
      <Fragment>
        <MainPanelTopbar />
        <div className="main-panel-center">
          <div className="cur-view-container">
            <div className="cur-view-path">
              <h3 className="sf-heading">{gettext('Offline Upload')}</h3>
            </div>
            <div className="cur-view-content">
              <Content
                loading={this.state.loading}
                errorMsg={this.state.errorMsg}
                detailedOfflineDownloadList={this.state.offlineDownloadTasks}
                currentPage={this.state.currentPage}
                hasNextPage={this.state.hasNextPage}
                curPerPage={this.state.perPage}
                resetPerPage={this.resetPerPage}
                getListByPage={this.getListByPage}
              />
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default DetailedOfflineDownloads;
