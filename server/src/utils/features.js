const features = {
    menu: true,
    admin: true,
    orders: process.env.ENABLE_ORDERS === 'true', // Example feature flag
};

const isFeatureEnabled = (featureName) => {
    return features[featureName] || false;
};

module.exports = { isFeatureEnabled };
