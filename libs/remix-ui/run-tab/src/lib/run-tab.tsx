// eslint-disable-next-line no-use-before-define
import React, { Fragment, useEffect, useReducer, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { ModalDialog } from '@remix-ui/modal-dialog'
// eslint-disable-next-line no-unused-vars
import { Toaster } from '@remix-ui/toaster'
import { ContractDropdownUI } from './components/contractDropdownUI'
import { InstanceContainerUI } from './components/instanceContainerUI'
import { RecorderUI } from './components/recorderCardUI'
import { SettingsUI } from './components/settingsUI'
import { Modal, Network, RunTabProps, Tx } from './types'
import { ContractData } from '@remix-project/core-plugin'
import { runTabInitialState, runTabReducer } from './reducers/runTab'
import {
  initRunTab,
  setAccountAddress,
  setUnitValue,
  setGasFeeAmount,
  setExecutionEnvironment,
  hideToaster,
  createNewAddress,
  setPassphraseModal,
  setMatchPassphraseModal,
  signMessage,
  fetchSelectedContract,
  createNewInstance,
  setSendValue,
  setBaseFeePerGas,
  setConfirmSettings,
  setGasPrice,
  setGasPriceStatus,
  setMaxFee,
  setMaxPriorityFee,
  removeInstances,
  removeSingleInstance,
  getExecutionContext,
  executeTransactions,
  loadFromAddress,
  storeNewScenario,
  runScenario,
  setScenarioPath,
  getFuncABIValues,
  setNetworkName,
  updateSelectedContract,
  syncContracts,
  isValidProxyAddress,
  isValidProxyUpgrade
} from './actions'
import './css/run-tab.css'
import { PublishToStorage } from '@remix-ui/publish-to-storage'
import { PassphrasePrompt } from './components/passphrase'
import { MainnetPrompt } from './components/mainnet'
import { ScenarioPrompt } from './components/scenario'
import { setIpfsCheckedState, setRemixDActivated } from './actions/payload'

export function RunTabUI(props: RunTabProps) {
  const { plugin } = props
  const [focusModal, setFocusModal] = useState<Modal>({
    hide: true,
    title: '',
    message: '',
    okLabel: '',
    okFn: () => {},
    cancelLabel: '',
    cancelFn: () => {}
  })
  const [modals, setModals] = useState<Modal[]>([])
  const [focusToaster, setFocusToaster] = useState<string>('')
  const [toasters, setToasters] = useState<string[]>([])
  const [publishData, setPublishData] = useState<{
    storage: 'ipfs' | 'swarm'
    contract: ContractData
  }>({
    storage: null,
    contract: null
  })
  const initialState = props.initialState || runTabInitialState

  initialState.selectExEnv = plugin.blockchain.getProvider()
  const [runTab, dispatch] = useReducer(runTabReducer, initialState)
  const REACT_API = { runTab }
  const currentfile = plugin.config.get('currentFile')
  const [solcVersion, setSolcVersion] = useState<{version: string, canReceive: boolean}>({ version: '', canReceive: true })

  const getVersion = () => {
    let version = '0.8.25'
    try {
      version = window.location.href.split('=')[5].split('+')[0].split('-')[1].slice(1) ?? '0.8.25'
      if (parseFloat(version) < 0.6) {
        setSolcVersion({ version: version, canReceive: false })
      } else {
        setSolcVersion({ version: version, canReceive: true })
      }
    } catch (e) {
      setSolcVersion({ version, canReceive: true })
      console.log(e)
    }
  }

  useEffect(() => {
    if (!props.initialState) {
      initRunTab(plugin, true)(dispatch)
      plugin.onInitDone()
    } else {
      initRunTab(plugin, false)(dispatch)
    }
  }, [plugin])

  useEffect(() => {
    plugin.onReady(runTab)
    plugin.call('pluginStateLogger', 'logPluginState', 'udapp', runTab)
  }, [REACT_API])

  useEffect(() => {
    if (modals.length > 0) {
      setFocusModal(() => {
        const focusModal = {
          hide: false,
          title: modals[0].title,
          message: modals[0].message,
          okLabel: modals[0].okLabel,
          okFn: modals[0].okFn,
          cancelLabel: modals[0].cancelLabel,
          cancelFn: modals[0].cancelFn,
          okBtnClass: modals[0].okBtnClass,
          cancelBtnClass: modals[0].cancelBtnClass
        }
        return focusModal
      })
      const modalList = modals.slice()

      modalList.shift()
      setModals(modalList)
    }
  }, [modals])

  useEffect(() => {
    if (runTab.notification.title) {
      modal(
        runTab.notification.title,
        runTab.notification.message,
        runTab.notification.labelOk,
        runTab.notification.actionOk,
        runTab.notification.labelCancel,
        runTab.notification.actionCancel
      )
    }
  }, [runTab.notification])

  useEffect(() => {
    if (toasters.length > 0) {
      setFocusToaster(() => {
        return toasters[0]
      })
      const toasterList = toasters.slice()

      toasterList.shift()
      setToasters(toasterList)
    }
  }, [toasters])

  useEffect(() => {
    if (runTab.popup) {
      toast(runTab.popup)
    }
  }, [runTab.popup])

  const setCheckIpfs = (value: boolean) => {
    dispatch(setIpfsCheckedState(value))
  }

  const modal = (
    title: string,
    message: string | JSX.Element,
    okLabel: string,
    okFn: () => void,
    cancelLabel?: string,
    cancelFn?: () => void,
    okBtnClass?: string,
    cancelBtnClass?: string
  ) => {
    setModals((modals) => {
      modals.push({
        message,
        title,
        okLabel,
        okFn,
        cancelLabel,
        cancelFn,
        okBtnClass,
        cancelBtnClass
      })
      return [...modals]
    })
  }

  const handleHideModal = () => {
    setFocusModal((modal) => {
      return { ...modal, hide: true, message: null }
    })
  }

  const handleToaster = () => {
    setFocusToaster('')
    hideToaster()
  }

  const toast = (toasterMsg: string) => {
    setToasters((messages) => {
      messages.push(toasterMsg)
      return [...messages]
    })
  }

  const resetStorage = () => {
    setPublishData({
      storage: null,
      contract: null
    })
  }

  const publishToStorage = (storage: 'ipfs' | 'swarm', contract: ContractData) => {
    setPublishData({
      storage,
      contract
    })
  }

  const gasEstimationPrompt = (msg: string) => {
    return (
      <div>
        <FormattedMessage id="udapp.gasEstimationPromptText" /> <br />
        {msg}
      </div>
    )
  }

  const passphrasePrompt = (message: string) => {
    return <PassphrasePrompt message={message} setPassphrase={setPassphraseModal} defaultValue={runTab.passphrase} />
  }

  const scenarioPrompt = (message: string, defaultValue) => {
    return <ScenarioPrompt message={message} setScenarioPath={setScenarioPath} defaultValue={defaultValue} />
  }

  const mainnetPrompt = (
    tx: Tx,
    network: Network,
    amount: string,
    gasEstimation: string,
    gasFees: (maxFee: string, cb: (txFeeText: string, priceStatus: boolean) => void) => void,
    determineGasPrice: (cb: (txFeeText: string, gasPriceValue: string, gasPriceStatus: boolean) => void) => void
  ) => {
    return (
      <MainnetPrompt
        init={determineGasPrice}
        network={network}
        tx={tx}
        amount={amount}
        gasEstimation={gasEstimation}
        setNewGasPrice={gasFees}
        updateBaseFeePerGas={setBaseFeePerGas}
        updateConfirmSettings={setConfirmSettings}
        updateGasPrice={setGasPrice}
        updateGasPriceStatus={setGasPriceStatus}
        updateMaxFee={setMaxFee}
        updateMaxPriorityFee={setMaxPriorityFee}
        maxFee={runTab.maxFee}
        maxPriorityFee={runTab.maxPriorityFee}
      />
    )
  }

  return (
    <Fragment>
      <div className="udapp_runTabView run-tab" id="runTabView" data-id="runTabView">
        <div className="list-group pb-4 list-group-flush">
          <SettingsUI
            networkName={runTab.networkName}
            personalMode={runTab.personalMode}
            selectExEnv={runTab.selectExEnv}
            accounts={runTab.accounts}
            setAccount={setAccountAddress}
            setUnit={setUnitValue}
            sendValue={runTab.sendValue}
            setSendValue={setSendValue}
            sendUnit={runTab.sendUnit}
            gasLimit={runTab.gasLimit}
            setGasFee={setGasFeeAmount}
            providers={runTab.providers}
            setExecutionContext={setExecutionEnvironment}
            createNewBlockchainAccount={createNewAddress}
            setPassphrase={setPassphraseModal}
            setMatchPassphrase={setMatchPassphraseModal}
            modal={modal}
            tooltip={toast}
            signMessageWithAddress={signMessage}
            passphrase={runTab.passphrase}
          />
          <ContractDropdownUI
            selectedAccount={runTab.accounts.selectedAccount}
            syncContracts={syncContracts}
            exEnvironment={runTab.selectExEnv}
            contracts={runTab.contracts}
            getSelectedContract={fetchSelectedContract}
            modal={modal}
            passphrase={runTab.passphrase}
            setPassphrase={setPassphraseModal}
            createInstance={createNewInstance}
            ipfsCheckedState={runTab.ipfsChecked}
            setIpfsCheckedState={setCheckIpfs}
            publishToStorage={publishToStorage}
            gasEstimationPrompt={gasEstimationPrompt}
            passphrasePrompt={passphrasePrompt}
            mainnetPrompt={mainnetPrompt}
            tooltip={toast}
            loadAddress={loadFromAddress}
            networkName={runTab.networkName}
            setNetworkName={setNetworkName}
            setSelectedContract={updateSelectedContract}
            remixdActivated={runTab.remixdActivated}
            isValidProxyAddress={isValidProxyAddress}
            isValidProxyUpgrade={isValidProxyUpgrade}
            proxy={runTab.proxy}
            solCompilerVersion={solcVersion}
            setCompilerVersion={setSolcVersion}
            getCompilerVersion={getVersion}
          />
          <RecorderUI
            plugin={plugin}
            gasEstimationPrompt={gasEstimationPrompt}
            passphrasePrompt={passphrasePrompt}
            mainnetPrompt={mainnetPrompt}
            storeScenario={storeNewScenario}
            runCurrentScenario={runScenario}
            scenarioPrompt={scenarioPrompt}
            count={runTab.recorder.transactionCount}
            currentFile={currentfile}
          />
          <InstanceContainerUI
            plugin={plugin}
            instances={runTab.instances}
            pinnedInstances={runTab.pinnedInstances}
            clearInstances={removeInstances}
            removeInstance={removeSingleInstance}
            getContext={getExecutionContext}
            gasEstimationPrompt={gasEstimationPrompt}
            passphrasePrompt={passphrasePrompt}
            mainnetPrompt={mainnetPrompt}
            runTransactions={executeTransactions}
            sendValue={runTab.sendValue}
            solcVersion={solcVersion}
            getVersion={getVersion}
            getFuncABIInputs={getFuncABIValues}
            exEnvironment={runTab.selectExEnv}
            editInstance={(instance) => {
              plugin.call('dapp-draft', 'edit', {
                address: instance.address,
                abi: instance.contractData.abi,
                name: instance.name,
                network: runTab.networkName,
                devdoc: instance.contractData.object.devdoc,
                methodIdentifiers: instance.contractData.object.evm.methodIdentifiers,
              })
            }}
          />
        </div>
      </div>
      <ModalDialog id="udappNotify" {...focusModal} handleHide={handleHideModal} />
      <Toaster message={focusToaster} handleHide={handleToaster} />
      <PublishToStorage id="udapp" api={plugin} resetStorage={resetStorage} storage={publishData.storage} contract={publishData.contract} />
    </Fragment>
  )
}
