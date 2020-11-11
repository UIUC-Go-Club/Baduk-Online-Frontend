module.exports = {
    webpack: {
        alias: {
            preact: "react"
        }
    },
    jest: {
        configure: {
            moduleNameMapper: {
                "preact": "react"
            }
        }
    }
};