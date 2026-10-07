const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_jkaA2H76u",
      userPoolClientId: "vlf91cpjd7o60q350emr3un61",
      loginWith: {
        email: true,
      },
    },
  },
  API: {
    REST: {
      PhotoGalleryAPI: {
        endpoint: "https://5ccbz9ugs7.execute-api.us-east-1.amazonaws.com/prod",
        region: "us-east-1",
      },
    },
  },
};

export default awsConfig;