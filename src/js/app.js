let web3
let contract
let currentAccount = null

// Lädt Metamask und startet die App
async function init() {
		if(window.ethereum) {
		await startApp()
	} else {
		console.log('Unable to detect the wallet provider')
	}
}

// Initialisiert die Variablen für die App
async function startApp() {
  web3 = new Web3(window.ethereum)
  console.log('web3', web3)
	contract = await loadContract()
  currentAccount = await ethereum.request({ method: 'eth_accounts'})[0]
	// Event Listeners
  contract.events.EinsatzIst().on('data', function(event) {
    console.log(event)
    $('#einsatzanzeigen').text('Einsatz ist: ' + web3.utils.fromWei(event.returnValues.Einsatz, 'ether') + ' ETH')
  })
  contract.events.GewinnerIst().on('data', function(event) {
    console.log(event)
    $('#gewinneranzeigen').text('Gewinner ist: ' + event.returnValues.Gewinner)
  })
}

// Lädt den contract
async function loadContract() {
	let jsonData = await $.getJSON('SchereSteinPapier.json')
  const abi = jsonData.abi
  const networkId = 5777//await web3.eth.net.getID()
  const contractAddr = jsonData.networks[networkId].address
	contract = new web3.eth.Contract(abi, contractAddr)
  console.log('contract', contract)
	return contract
}

const getWeb3 = async () => {
  return new Promise(async (reslove, reject) => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts'})
      currentAccount = accounts[0]
      console.log('account', currentAccount)
      reslove(web3)
    } catch (error) {
      reject(error)
    }
  })
}
	
async function spielen() {
	console.log('Spiel beitreten')
  const einsatz = $('#einsatz').val()
  console.log(currentAccount)
  const transaction = await contract.methods.spielen().send({ from: currentAccount, value: web3.utils.toWei(einsatz, 'ether') })
  console.log(transaction)
}

async function waehlen() {
	let key = $('#passwort').val()
	let choice = $('#wahl').val()
	let encodedChoice = web3.utils.keccak256(web3.utils.encodePacked(choice, key))
	const trasaction = await contract.methods.waehlen(encodedChoice).send({ from: currentAccount })
  console.log(trasaction)
}

async function wahlentschluesseln() {
	let key = $('#passwort1').val()
	let choice = $('#wahl1').val()
	const trasaction = await contract.methods.wahlentschluesseln(choice, key).send({from: currentAccount })
  console.log(trasaction)
}

async function erstatten() {
  const trasaction = await contract.methods.erstatten().send({from: currentAccount })
  console.log(trasaction)
}

async function ETHabheben() {
  const trasaction = await contract.methods.ETHabheben().send({from: currentAccount })
  console.log(trasaction)
}

// Button handler
$('#connectwallet').click(() => {const Web3 = getWeb3();})

// Button handler
$('#spielen').click(() => {spielen();})

// Button handler
$('#wahltreffen').click(() => {waehlen();})

// Button handler
$('#wahlbestaetigen').click(() => {wahlentschluesseln();})

// Button handler
$('#einsatzanfordern').click(() => {erstatten();})

// Button handler
$('#abbuchen').click(() => {ETHabheben();})

init()







/*function detectEthereumProvider({ mustBeMetaMask = false, silent = false, timeout = 3000, } = {}) {
  _validateInputs();
  let handled = false;
  return new Promise((resolve) => {
      if (window.ethereum) {
          handleEthereum();
      }
      else {
          window.addEventListener('ethereum#initialized', handleEthereum, { once: true });
          setTimeout(() => {
              handleEthereum();
          }, timeout);
      }
      function handleEthereum() {
          if (handled) {
              return;
          }
          handled = true;
          window.removeEventListener('ethereum#initialized', handleEthereum);
          const { ethereum } = window;
          if (ethereum && (!mustBeMetaMask || ethereum.isMetaMask)) {
              resolve(ethereum);
          }
          else {
              const message = mustBeMetaMask && ethereum
                  ? 'Non-MetaMask window.ethereum detected.'
                  : 'Unable to detect window.ethereum.';
              !silent && console.error('@metamask/detect-provider:', message);
              resolve(null);
          }
      }
  });

  function _validateInputs() {
      if (typeof mustBeMetaMask !== 'boolean') {
          throw new Error(`@metamask/detect-provider: Expected option 'mustBeMetaMask' to be a boolean.`);
      }
      if (typeof silent !== 'boolean') {
          throw new Error(`@metamask/detect-provider: Expected option 'silent' to be a boolean.`);
      }
      if (typeof timeout !== 'number') {
          throw new Error(`@metamask/detect-provider: Expected option 'timeout' to be a number.`);
      }
  }
}*/

/*App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    const provider = await detectEthereumProvider();
	// If the provider exists, start the app
	if(provider) {
		await startApp(provider);
	} else {
		console.log('Unable to detect the wallet provider');
	}
    return App.initContract();
  },

  initContract: function() {
    /*
     * Replace me...
     */

/*    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: function() {
    /*
     * Replace me...
     */
  //}

/* handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    /*
     * Replace me...
     */
  //}

//}

/*$(function() {
  $(window).load(function() {
    App.init();
  });
}); */
