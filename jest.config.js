module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom", // use 'node' if you don't need DOM
    roots: ["<rootDir>/lib/ai/__tests__"],
    testMatch: ["**/?(*.)+(test).ts"],
};
