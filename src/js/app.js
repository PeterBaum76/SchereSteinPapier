let web3
let contract
let currentAccount = null
let SSPabi
let SchereSteinPapier
let FactoryAddresse

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
  let SSP = await $.getJSON('SchereSteinPapier.json')
  SSPabi = SSP.abi
  console.log('SSPabi', SSPabi)
  currentAccount = await ethereum.request({ method: 'eth_accounts'})[0]
	// Event Listeners
  contract.events.Spielerzeugt().on('data', function(event) {
    console.log(event)
    $('#addresseanzeigen').text('Spiel-Addresse ist: ' + event.returnValues.Spieladdresse)
    FactoryAddresse = event.returnValues.Factoryaddresse
    console.log('Factoryaddresse', FactoryAddresse)
  })
}

// Lädt den Factory-contract
async function loadContract() {
  let jsonData = await $.getJSON('Factory.json')
  const abi = jsonData.abi
  const networkId = await web3.eth.net.getId() 
  const contractAddr = jsonData.networks[networkId].address
	contract = new web3.eth.Contract(abi, contractAddr)
  console.log('contract', contract)
	return contract
}

// Verbindet MetaMask
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

// Erzeugt einen neuen Spiel-contract
async function spielerzeugen() {
  console.log('Spiel erzeugen')
  const transaction = await contract.methods.createChild().send({ from: currentAccount })
  console.log(transaction)
}

// Initialisiert das Spiel
async function spielinitialisieren() {
  console.log('Spiel initialisieren')
  const add = $('#addresse').val()
  SchereSteinPapier = new web3.eth.Contract(SSPabi, add)
  const transaction = await SchereSteinPapier.events.EinsatzIst().on('data', function(event) {
    console.log(event)
    $('#einsatzanzeigen').text('Einsatz ist: ' + web3.utils.fromWei(event.returnValues.Einsatz, 'ether') + ' ETH')
  })
  console.log(transaction)
  const transaction1 = await SchereSteinPapier.events.GewinnerIst().on('data', function(event) {
    console.log(event)
    if(event.returnValues.Gewinner == 0x0000000000000000000000000000000000000000) {
      $('#gewinneranzeigen').text('Spiel ist unentschieden')
    }
    else {
    $('#gewinneranzeigen').text('Gewinner ist: ' + event.returnValues.Gewinner)
    }
  })
  console.log(transaction1)
  const transaction2 = await SchereSteinPapier.events.Spielstatus().on('data', function(event) {
    console.log(event)
    if(event.returnValues.Status == 1) {
      $('#Spielstatus').text('Triff deine Wahl')
    }
    else {
      $('#Spielstatus').text('Bestätige deine Wahl')
    }
  })
  const transaction3 = await SchereSteinPapier.methods.init(FactoryAddresse).send({ from: currentAccount })
  console.log(transaction3)
}

// Funktion um Spiel beizutreten
async function spielen() {
	console.log('Spiel beitreten')
  const einsatz = $('#einsatz').val()
  console.log(currentAccount)
  const transaction = await SchereSteinPapier.methods.spielen().send({ from: currentAccount, value: web3.utils.toWei(einsatz, 'ether') })
  console.log(transaction)
}

// Funktion um den verschlüsselten Zug zu machen
async function waehlen() {
	let key = $('#passwort').val()
	let choice = $('#wahl').val()
	let encodedChoice = web3.utils.keccak256(web3.utils.encodePacked(choice, key))
	const trasaction = await SchereSteinPapier.methods.waehlen(encodedChoice).send({ from: currentAccount })
  console.log(trasaction)
}

// Funktion um den Zug aufzudecken
async function wahlentschluesseln() {
	let key = $('#passwort1').val()
	let choice = $('#wahl1').val()
	const trasaction = await SchereSteinPapier.methods.wahlentschluesseln(choice, key).send({from: currentAccount })
  console.log(trasaction)
}

// Funktion um den Betrag zu erstatten, falls Mitspieler nicht antwortet
async function erstatten() {
  const trasaction = await SchereSteinPapier.methods.erstatten().send({from: currentAccount })
  console.log(trasaction)
}

// Funktion um die Service-Gebühr abzuheben (owner)
async function ETHabheben() {
  const trasaction = await contract.methods.ETHabheben().send({from: currentAccount })
  console.log(trasaction)
}

// Button handler
$('#connectwallet').click(() => {const Web3 = getWeb3();})

// Button handler
$('#spielerzeugen').click(() => {spielerzeugen();})

// Button handler
$('#spielinitialisieren').click(() => {spielinitialisieren();})

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
