// Imports
// ========================================================
const { ethers } = require("hardhat");

// torii generated proof
const proof = {
  id: 1,
  circuitId: "credentialAtomicQuerySigV2OnChain",
  proof: {
    pi_a: [
      "5085371707674847583621674174847420745834962809125273786330203389901569212283",
      "19632664577490679016046201611451244486599996747621624531062843956640731911716",
      "1",
    ],
    pi_b: [
      [
        "10294279260393756041854635933727652758774453472740371051283365227736855806170",
        "10049845513815408936825865249217480891213388991806854164777602062873643094636",
      ],
      [
        "8342828976376181781634770257073053507462452216420803792453438706631467254249",
        "18371960135864123895136768777486215904830814236974871521495328847822939294149",
      ],
      ["1", "0"],
    ],
    pi_c: [
      "3780110065713984037587609558081138800585969039493315399455989944756986919469",
      "17516722092218070563513870603999460171875164120462326070155126836746977369209",
      "1",
    ],
    protocol: "groth16",
    curve: "bn128",
  },
  pub_signals: [
    "1",
    "22742160769770519444612248005905255398806690098027787207831148430397083905",
    "15045271939084694661437431358729281571840804299863053791890179002991342242959",
    "6624349039228295194714637061287869474347588845056309775042783848620933560383",
    "1",
    "0",
    "7035233703809473779787447569724895380693518150459779007479517532546159350854",
    "19766996379179526089924694043513742444589113215877987844871375762373874178",
    "0",
    "6624349039228295194714637061287869474347588845056309775042783848620933560383",
    "1690926889",
  ],
};

const main = async () => {
  const verifierContract = "ERC20Verifier";
  // Deployed contract address
  const ERC20VerifierAddress = "0xA59B9E70639B2A4CF51af47f39D14B1E735301Fb";
  // Retrieve contract to interact with it
  const erc20Verifier = await ethers.getContractAt(
    verifierContract,
    ERC20VerifierAddress
  );

  try {
    const { inputs, pi_a, pi_b, pi_c } = prepareInputs(proof);
    // const { inputs, pi_a, pi_b, pi_c } = toBigNumber(prepareInputs(proof));
    const requestId = Number(await erc20Verifier.TRANSFER_REQUEST_ID());
    // construction of the params is inspired by
    // https://github.com/0xPolygonID/contracts/blob/main/test/validators/sig/index.ts
    // see utils below this function
    const tx = await erc20Verifier.submitZKPResponse(
      requestId,
      inputs,
      pi_a,
      pi_b,
      pi_c
    );

    tx.wait();
    console.log(
      `Request set at:\nNOTE: May take a little bit to show up\nhttps://mumbai.polygonscan.com/tx/${tx.hash}`
    );
  } catch (e) {
    console.error("Error: ", e);
  }
};

// Init
// ========================================================
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// UTILS copied from:
// https://github.com/0xPolygonID/contracts/blob/main/test/utils/deploy-utils.ts
// when looking on how to construct params from submitZKPResponse
function prepareInputs(json) {
  const { proof, pub_signals } = json;
  const { pi_a, pi_b, pi_c } = proof;
  const [[p1, p2], [p3, p4]] = pi_b;
  const preparedProof = {
    pi_a: pi_a.slice(0, 2),
    pi_b: [
      [p2, p1],
      [p4, p3],
    ],
    pi_c: pi_c.slice(0, 2),
  };

  return { inputs: pub_signals, ...preparedProof };
}

function toBigNumber({ inputs, pi_a, pi_b, pi_c }) {
  return {
    inputs: inputs.map((input) => ethers.BigNumber.from(input)),
    pi_a: pi_a.map((input) => ethers.BigNumber.from(input)),
    pi_b: pi_b.map((arr) => arr.map((input) => ethers.BigNumber.from(input))),
    pi_c: pi_c.map((input) => ethers.BigNumber.from(input)),
  };
}
