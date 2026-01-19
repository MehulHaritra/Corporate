const { test, expect } = require('@playwright/test');

const COUNTRIES = [
  {
    name: 'Spain',
    apiKey: 'e54bfb66ab2016f80ce0bd01188d84',
    secretKey: '3f17297a2ce1330ab9f9d923b4ba5435e3366e85b19e4119f6efc11c79cebd2b',
    createEndpoint: '/employee/create/bls/spain',
    memberData: {
      firstName: 'Harry',
      middleName: '',
      sureName: 'Harrison',
      email: 'spain45@yopmail.com',
      countryCode: 34,
      contact: '0001112221',
      apiKey: 'e54bfb66ab2016f80ce0bd01188d84',
      corporateID: '66ab2016f80ce0bd01188d84'
    }
  },
  /*{
    name: 'Indonesia',
    apiKey: '9a4d8052e2e8dd8720bfdfd6e54831',
    secretKey: '3f17297a2ce1330ab9f9d923b4ba5435e3366e85b19e4119f6efc11c79cebd2b',
    createEndpoint: '/employee/create/bls/intl/indonesia',
    memberData: {
      firstName: 'Anita',
      middleName: '',
      sureName: 'Wijaya',
      email: 'indonesia1@yopmail.com',
      countryCode: 62,
      contact: '9999999999',
      apiKey: '9a4d8052e2e8dd8720bfdfd6e54831',
      corporateID: '672c49875116f1f249a0e831'
    }
  },
  {
    name: 'Morocco',
    apiKey: '6732edcb43847940a4c12ce06732e',
    secretKey: '3f17297a2ce1330ab9f9d923b4ba5435e3366e85b19e4119f6efc11c79cebd2b',
    createEndpoint: '/employee/create/bls/intl/morocco',
    memberData: {
      firstName: 'Youssef',
      middleName: '',
      sureName: 'Alami',
      email: 'morocco1@yopmail.com',
      countryCode: 212,
      contact: '9999999999',
      apiKey: '6732edcb43847940a4c12ce06732e',
      corporateID: '6732edcb43847940a4c12ce0'
    }
  },
  {
    name: 'Algeria',
    apiKey: '9a4d8067765a517a74963c59abfc76',
    secretKey: '3f17297a2ce1330ab9f9d923b4ba5435e3366e85b19e4119f6efc11c79cebd2b',
    createEndpoint: '/employee/create/bls/algeria',
    memberData: {
      firstName: 'Karim',
      middleName: '',
      sureName: 'Benali',
      email: 'algeria1@yopmail.com',
      countryCode: 213,
      contact: '9999999999',
      apiKey: '9a4d8067765a517a74963c59abfc76',
      corporateID: '67765a517a74963c59abfc76'
    }
  },
  {
    name: 'Ecuador',
    apiKey: '9a4d8067765a56e1bcd2b17745688e',
    secretKey: '3f17297a2ce1330ab9f9d923b4ba5435e3366e85b19e4119f6efc11c79cebd2b',
    createEndpoint: '/employee/create/bls/ecuador',
    memberData: {
      firstName: 'Carlos',
      middleName: '',
      sureName: 'Mendoza',
      email: 'ecuador1@yopmail.com',
      countryCode: 593,
      contact: '9999999999',
      apiKey: '9a4d8067765a56e1bcd2b17745688e',
      corporateID: '67e3dcf6e1bcd2b17745688e'
    }
  },
  {
    name: 'China',
    apiKey: '9a4d8067765a517a74963c5967c165',
    secretKey: '3f17297a2ce1330ab9f9d923b4ba5435e3366e85b19e4119f6efc11c79cebd2b',
    createEndpoint: '/employee/create/bls/china',
    memberData: {
      firstName: 'Li',
      middleName: '',
      sureName: 'Wei',
      email: 'china1@yopmail.com',
      countryCode: 86,
      contact: '9999999999',
      apiKey: '9a4d8067765a517a74963c5967c165',
      corporateID: '67c16512a161cf2da13069ec'
    }
  },
  {
    name: 'Thailand',
    apiKey: '6811b2b5d37f9476fbd1d54167c165',
    secretKey: '3f17297a2ce1330ab9f9d923b4ba5435e3366e85b19e4119f6efc11c79cebd2b',
    createEndpoint: '/employee/create/bls/thailand',
    memberData: {
      firstName: 'Somchai',
      middleName: '',
      sureName: 'Srisom',
      email: 'thailand1@yopmail.com',
      countryCode: 66,
      contact: '9999999999',
      apiKey: '6811b2b5d37f9476fbd1d54167c165',
      corporateID: '6811b2b5d37f9476fbd1d541'
    }
  },
  {
    name: 'Nigeria',
    apiKey: '6811b42ad37f9476fbd1d55867c165',
    secretKey: '3f17297a2ce1330ab9f9d923b4ba5435e3366e85b19e4119f6efc11c79cebd2b',
    createEndpoint: '/employee/create/bls/nigeria',
    memberData: {
      firstName: 'Chidi',
      middleName: '',
      sureName: 'Okonkwo',
      email: 'nigeria1@yopmail.com',
      countryCode: 234,
      contact: '9999999999',
      apiKey: '6811b42ad37f9476fbd1d55867c165',
      corporateID: '6811b42ad37f9476fbd1d558'
    }
  },
  {
    name: 'South Africa',
    apiKey: '6811b399d37f9476fbd1d54f67c165',
    secretKey: '3f17297a2ce1330ab9f9d923b4ba5435e3366e85b19e4119f6efc11c79cebd2b',
    createEndpoint: '/employee/create/bls/southAfrica',
    memberData: {
      firstName: 'Thabo',
      middleName: '',
      sureName: 'Mokoena',
      email: 'southafrica1@yopmail.com',
      countryCode: 27,
      contact: '9999999999',
      apiKey: '6811b399d37f9476fbd1d54f67c165',
      corporateID: '6811b399d37f9476fbd1d54f'
    }
  },
  {
    name: 'Philippines',
    apiKey: '6811b342d37f9476fbd1d54867c160',
    secretKey: '3f17297a2ce1330ab9f9d923b4ba5435e3366e85b19e4119f6efc11c79cebd2b',
    createEndpoint: '/employee/create/bls/philippines',
    memberData: {
      firstName: 'Mariaa',
      middleName: '',
      sureName: 'Santos',
      email: 'philippines1@yopmail.com',
      countryCode: 63,
      contact: '9999991111',
      apiKey: '6811b342d37f9476fbd1d54867c160',
      corporateID: '6811b342d37f9476fbd1d548'
    }
  }*/
];

const BASE_URL = 'https://staging.corporateapi.welcomecure.com';

for (const config of COUNTRIES) {

test(`Upload member data for ${config.name}`, async ({ request }) => {
    //  Generate token
    console.log(`Generating token for ${config.name}...`);
    const tokenResponse = await request.post(`${BASE_URL}/employee/generatedtoken`, {
      data: {  
        apiKey: config.apiKey,
        secretKey: config.secretKey
      }
    });

    const tokenJson = await tokenResponse.json();
    console.log('Token response:', JSON.stringify(tokenJson, null, 2));
    const authToken = tokenJson.data?.token;

    if (!authToken || typeof authToken !== 'string') {
      throw new Error(` Invalid token for ${config.name}`);
    }

    // Create member
    console.log(`Creating member in ${config.name}...`);
    const createResponse = await request.post(`${BASE_URL}${config.createEndpoint}`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      data: config.memberData
    });

    // Validate
    
    if (!createResponse.ok()) {
    console.log(`
 CREATE FAILED`);
    console.log(`Status: ${createResponse.status()}`);
    console.log(`Response: ${await createResponse.text()}`);
  }

  expect(createResponse.ok(), `Member creation failed: ${await createResponse.text()}`).toBeTruthy();

  const createResult = await createResponse.json();
  console.log(` Member created successfully in ${config.name}:`, createResult);
  });
}

