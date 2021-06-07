import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody } from 'reactstrap';
import { gettext, lang, mediaUrl, logoPath, logoWidth, logoHeight, siteTitle, seafileVersion, additionalAboutDialogLinks } from '../../utils/constants';

const propTypes = {
  onCloseAboutDialog: PropTypes.func.isRequired,
};

class AboutDialog extends React.Component {

  toggle = () => {
    this.props.onCloseAboutDialog();
  }

  renderExternalAboutLinks = () => {
    if (additionalAboutDialogLinks && (typeof additionalAboutDialogLinks) === 'object') {
      let keys = Object.keys(additionalAboutDialogLinks);
      return keys.map((key, index) => {
        return <a key={index} className="d-block" href={additionalAboutDialogLinks[key]}>{key}</a>;
      });
    }
    return null;
  }

  render() {
    let href = lang === lang == 'zh-cn' ? 'http://seafile.com/about/' : 'http://seafile.com/en/about/';

    return (
      <Modal isOpen={true} toggle={this.toggle}>
        <ModalBody>
          <button type="button" className="close" onClick={this.toggle}><span aria-hidden="true">×</span></button>
          <div className="about-content">
            <p><img src={mediaUrl + logoPath} height={logoHeight} width={logoWidth} title={siteTitle} alt="logo" /></p>
            <p>{gettext('Server Version: ')}{seafileVersion}<br />© 2021 SDU Netdisk Engineering Team</p>
            <p>{this.renderExternalAboutLinks()}</p>
            <p>{gettext('Special thanks to: ')}<a href={href} target="_blank">{gettext('Seafile')}</a> {gettext('for their open-source Seafile.')}</p>
          </div>
        </ModalBody>
      </Modal>
    );
  }
}

AboutDialog.propTypes = propTypes;

export default AboutDialog;
