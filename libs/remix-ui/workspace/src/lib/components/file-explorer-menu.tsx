import {CustomTooltip} from '@remix-ui/helper'
import React, {useState, useEffect} from 'react' //eslint-disable-line
import {FormattedMessage} from 'react-intl'
import {Placement} from 'react-bootstrap/esm/Overlay'
import {FileExplorerMenuProps} from '../types'
const _paq = (window._paq = window._paq || [])

export const FileExplorerMenu = (props: FileExplorerMenuProps) => {
  const [state, setState] = useState({
    menuItems: [
      {
        action: 'createNewFile',
        title: 'Create new file',
        icon: 'far fa-file',
        placement: 'top'
      },
      {
        action: 'createNewFolder',
        title: 'Create new folder',
        icon: 'far fa-folder',
        placement: 'top'
      },
      {
        action: 'publishToGist',
        title: 'Publish current workspace to GitHub gist',
        icon: 'fab fa-github',
        placement: 'top'
      },
      {
        action: 'uploadFile',
        title: 'Upload files into current workspace',
        icon: 'far fa-upload',
        placement: 'top'
      },
      {
        action: 'uploadFolder',
        title: 'Upload folder into current workspace',
        icon: 'far fa-folder-upload',
        placement: 'top'
      },
      {
        action: 'updateGist',
        title: 'Update the current [gist] explorer',
        icon: 'fab fa-github',
        placement: 'bottom-start'
      }
    ].filter(
      (item) =>
        props.menuItems &&
        props.menuItems.find((name) => {
          return name === item.action
        })
    ),
    actions: {}
  })
  const enableDirUpload = {directory: '', webkitdirectory: ''}

  useEffect(() => {
    const actions = {
      updateGist: () => {}
    }

    setState((prevState) => {
      return {...prevState, actions}
    })
  }, [])

  return (
    <>
      <span data-id="spanContaining" className="pl-0 pb-1 w-50">
        {state.menuItems.map(({action, title, icon, placement}, index) => {
          if (action === 'uploadFile') {
            return (
              <CustomTooltip
                placement={placement as Placement}
                tooltipId="uploadFileTooltip"
                tooltipClasses="text-nowrap"
                tooltipText={<FormattedMessage id={`filePanel.${action}`} defaultMessage={title} />}
                key={`index-${action}-${placement}-${icon}`}
              >
                <label id={action} style={{fontSize: '1.1rem', cursor: 'pointer'}} data-id={'fileExplorerUploadFile' + action} className={icon + ' mb-0 px-1 remixui_newFile'} key={`index-${action}-${placement}-${icon}`}>
                  <input
                    id="fileUpload"
                    data-id="fileExplorerFileUpload"
                    type="file"
                    onChange={(e) => {
                      e.stopPropagation()
                      _paq.push(['trackEvent', 'fileExplorer', 'fileAction', action])
                      props.uploadFile(e.target)
                      e.target.value = null
                    }}
                    multiple
                  />
                </label>
              </CustomTooltip>
            )
          } else if (action === 'uploadFolder') {
            return (
              <CustomTooltip
                placement={placement as Placement}
                tooltipId="uploadFolderTooltip"
                tooltipClasses="text-nowrap"
                tooltipText={<FormattedMessage id={`filePanel.${action}`} defaultMessage={title} />}
                key={`index-${action}-${placement}-${icon}`}
              >
                <label id={action} style={{fontSize: '1.1rem', cursor: 'pointer'}} data-id={'fileExplorerUploadFolder' + action} className={icon + ' mb-0 px-1 remixui_newFile'} key={`index-${action}-${placement}-${icon}`}>
                  <input
                    id="folderUpload"
                    data-id="fileExplorerFolderUpload"
                    type="file"
                    onChange={(e) => {
                      e.stopPropagation()
                      _paq.push(['trackEvent', 'fileExplorer', 'fileAction', action])
                      props.uploadFolder(e.target)
                      e.target.value = null
                    }}
                    {...enableDirUpload}
                    multiple
                  />
                </label>
              </CustomTooltip>
            )
          } else {
            return (
              <CustomTooltip
                placement={placement as Placement}
                tooltipId={`${action}-${title}-${icon}-${index}`}
                tooltipClasses="text-nowrap"
                tooltipText={<FormattedMessage id={`filePanel.${action}`} defaultMessage={title} />}
                key={`${action}-${title}-${index}`}
              >
                <label
                  id={action}
                  style={{fontSize: '1.1rem', cursor: 'pointer'}}
                  data-id={'fileExplorerNewFile' + action}
                  onClick={(e) => {
                    e.stopPropagation()
                    _paq.push(['trackEvent', 'fileExplorer', 'fileAction', action])
                    if (action === 'createNewFile') {
                      props.createNewFile()
                    } else if (action === 'createNewFolder') {
                      props.createNewFolder()
                    } else if (action === 'publishToGist') {
                      props.publishToGist()
                    } else {
                      state.actions[action]()
                    }
                  }}
                  className={'newFile ' + icon + ' pr-2 pl-1 remixui_newFile'}
                  key={`${action}-${title}-${index}`}
                ></label>
              </CustomTooltip>
            )
          }
        })}
      </span>
    </>
  )
}// add tooltip to sort icon. then wireup logic to sort files by name ascending/descending

export default FileExplorerMenu
