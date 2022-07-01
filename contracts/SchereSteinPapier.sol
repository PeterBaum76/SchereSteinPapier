// SC für das Spiel "Schere, Stein, Papier" als Ethereum DApp

// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

contract CloneFactory {

  function createClone(address target) internal returns (address result) {
    bytes20 targetBytes = bytes20(target);
    assembly {
      let clone := mload(0x40)
      mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
      mstore(add(clone, 0x14), targetBytes)
      mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
      result := create(0, clone, 0x37)
    }
  }

  function isClone(address target, address query) internal view returns (bool result) {
    bytes20 targetBytes = bytes20(target);
    assembly {
      let clone := mload(0x40)
      mstore(clone, 0x363d3d373d3d3d363d7300000000000000000000000000000000000000000000)
      mstore(add(clone, 0xa), targetBytes)
      mstore(add(clone, 0x1e), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)

      let other := add(clone, 0x40)
      extcodecopy(query, other, 0, 0x2d)
      result := and(
        eq(mload(clone), mload(other)),
        eq(mload(add(clone, 0xd)), mload(add(other, 0xd)))
      )
    }
  }
}

contract Factory is CloneFactory {

     address[] public childrenaddress;
     address masterContract;
     address public owner;

     constructor(address _masterContract){
         masterContract = _masterContract;
         owner = msg.sender;
     }

    event Spielerzeugt(address Spieladdresse, address Factoryaddresse);

    function createChild() external{
        address child = createClone(masterContract);
        childrenaddress.push(child);
        emit Spielerzeugt(child, address(this));
    }

    /*function getAddress() public view returns(address) {
        return address(this);
    }*/

    function ETHabheben() public  {
        require (msg.sender == owner, "Nur der Smart Contract owner/Betreiber ist berechtigt!");
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable{}

}

contract SchereSteinPapier {
    
    // speichern der Factory-Addresse
    address payable public FactoryAddress;

    // speichern der Spieler-Addressen
    address [2] public Spieler;

    // speichern des Spieleinsatzes
    uint public Einsatz;

    // speichern des verschlüsselten Spiel-Zugs
    bytes32[2] public VerschluesselterZug;
 
    // speichern des entschlüsselten Spiel-Zugs
    // 0: initial
    // 1: Schere
    // 2: Stein
    // 3: Papier
    uint[2] public Zug;

    // Spiel Status
    enum Status {Beginn, Wahl, Entscheidung, Auszahlung}
    Status status;

    // Timer
    uint public stop;
    uint public stop1;
    uint public jetzt;

    // event für Einsatz
    event EinsatzIst (uint Einsatz);

    // event für Gewinner
    event GewinnerIst (address Gewinner);

    // Modifier zum Prüfen ob es sich um einen Spieler handelt
    modifier IstSpieler() {
        require (msg.sender == Spieler[0] || msg.sender == Spieler[1], "Du bist kein Spieler der aktieven Runde!");
        _;
    }

    // Konstruktor legt owner fest und initialisiert Variablen
    constructor() public {
        initialisieren();
    }

    function init(address _FactoryAddress) external {
        FactoryAddress = payable(_FactoryAddress);
    }

    // Funktion zum initialisieren des Spiels
    function initialisieren() private {
        Spieler[0] = payable(address(0));
        Spieler[1] = payable(address(0));
        VerschluesselterZug[0] = 0;
        VerschluesselterZug[1] = 0;
        Zug[0] = 0;
        Zug[1] = 0;
        status = Status.Beginn;
    }

    // Funktion zum Spiel-Beitritt
    function spielen() public payable {
         require (status == Status.Beginn, "Das Spiel hat bereits begonnen!");
         require (msg.value > 1000000000000000, "Du musst einen Einsatz (min. 0,001 ETH) setzen; der owner erhaelt 0,000.1 ETH!");
         if (Spieler[0] == address(0)) {
             Einsatz = msg.value;
             emit EinsatzIst(Einsatz);
             Spieler[0] = payable(msg.sender);
         }
         else if (Spieler[1] == address(0)) {
             require (msg.sender != Spieler[0], "Du kannst nicht gegen dich selbst spielen!");
             require (msg.value == Einsatz, "Dein Spiel-Einsatz muss dem Vorgegebenen entsprechen!");
             Spieler[1] = payable(msg.sender);
             status = Status.Wahl;
             stop = block.timestamp + 30;
         }
    }

    // Funktion zum Wählen von Schere, Stein oder Papier
    function waehlen(bytes32 wahl) public IstSpieler {
        require (status == Status.Wahl, "Wahl kann noch nicht getroffen werden oder wurde bereits getroffen!");
        if (msg.sender == Spieler[0]) {
            VerschluesselterZug[0] = wahl;
        }
        else if (msg.sender == Spieler[1]) {
            VerschluesselterZug[1] = wahl;
        }
        if (VerschluesselterZug[0] != 0 && VerschluesselterZug[1] != 0) {
            status = Status.Entscheidung;
            stop1 = block.timestamp + 900;
        }
    }

    // Funktion deckt Wahl des Spielers auf
    function wahlentschluesseln(uint wahl, string memory schluessel) public IstSpieler {
        require (status == Status.Entscheidung, "Die Wahl kann noch nicht aufgedeckt werden!");
        bytes32 verschluesselt = keccak256(abi.encodePacked(wahl, schluessel)); //keccak256 takes a hex argument and not a string
        if (msg.sender == Spieler[0]) {
            if (verschluesselt == VerschluesselterZug[0]) {
                Zug[0] = wahl;
            }
        }
        else {
            if (verschluesselt == VerschluesselterZug[1]) {
                Zug[1] = wahl;
            }
        }
        if (Zug[0] != 0 && Zug[1] != 0) {
            status = Status.Auszahlung;
            entscheidung();
        }
    }

    // Funktion zur Entscheidungsfindung des Spiels
    function entscheidung() private {
        require (status == Status.Auszahlung);
        if (Zug[0] == 1) {
            if (Zug[1] == 1) {
                payable(Spieler[0]).transfer(Einsatz-100000000000000);
                payable(Spieler[1]).transfer(Einsatz-100000000000000);
            }
            if (Zug[1] == 2) {
                payable(Spieler[1]).transfer(2*Einsatz-200000000000000);
                emit GewinnerIst(Spieler[1]);
            }
            if (Zug[1] == 3) {
                payable(Spieler[0]).transfer(2*Einsatz-200000000000000);
                emit GewinnerIst(Spieler[0]);
            }
        }
        if (Zug[0] == 2) {
            if (Zug[1] == 1) {
                payable(Spieler[0]).transfer(2*Einsatz-200000000000000);
                emit GewinnerIst(Spieler[0]);
            }
            if (Zug[1] == 2) {
                payable(Spieler[0]).transfer(Einsatz-100000000000000);
                payable(Spieler[1]).transfer(Einsatz-100000000000000);
            }
            if (Zug[1] == 3) {
                payable(Spieler[1]).transfer(2*Einsatz-200000000000000);
                emit GewinnerIst(Spieler[1]);
            }
        }
        if (Zug[0] == 3) {
            if (Zug[1] == 1) {
                payable(Spieler[1]).transfer(2*Einsatz-200000000000000);
                emit GewinnerIst(Spieler[1]);
            }
            if (Zug[1] == 2) {
                payable(Spieler[0]).transfer(2*Einsatz-200000000000000);
                emit GewinnerIst(Spieler[0]);
            }
            if (Zug[1] == 3) {
                payable(Spieler[0]).transfer(Einsatz-100000000000000);
                payable(Spieler[1]).transfer(Einsatz-100000000000000);
            }
        }
        payable(FactoryAddress).transfer(address(this).balance); 
        initialisieren();
    }

    // Funktion zum Erstatten des Einsatzes
    function erstatten() public IstSpieler {
        jetzt = block.timestamp;
        require ((status == Status.Wahl && stop < jetzt) || (status == Status.Entscheidung && stop1 < jetzt), "Du befindest dich im falschen Spiel-Status oder die Zeit ist noch nicht abgelaufen!");
        if (stop < jetzt) {
            if (VerschluesselterZug[0] == 0) {
                payable(Spieler[1]).transfer(2*Einsatz-200000000000000);
                initialisieren();
            }
            else if (VerschluesselterZug[1] == 0) {
                payable(Spieler[0]).transfer(2*Einsatz-200000000000000);
                initialisieren();
            }
            payable(FactoryAddress).transfer(address(this).balance);
        }
        else if (stop1 < jetzt) {
            if (Zug[0] == 0) {
                payable(Spieler[1]).transfer(2*Einsatz-200000000000000);
                initialisieren();
            }
            else if (Zug[1] == 0) {
                payable(Spieler[0]).transfer(2*Einsatz-200000000000000);
                initialisieren();
            }
            payable(FactoryAddress).transfer(address(this).balance);
        }
    }
}