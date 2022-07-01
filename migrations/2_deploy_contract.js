const SchereSteinPapier = artifacts.require("SchereSteinPapier");
const Factory = artifacts.require("Factory"); 
module.exports = function (_deployer) {_deployer.deploy(SchereSteinPapier).then(() => _deployer.deploy(Factory, SchereSteinPapier.address)); 
};