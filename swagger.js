import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'Ticket Support System API',
        description: 'This API is for CSE341 Final Project. REST API for a support ticketing system'
    },
    host: 'cse341-project-02-beyu.onrender.com',
    schemes: ['https']
};

const outputFile = './swagger.json';
const routes = ['./routes/routes.js'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen()(outputFile, routes, doc);