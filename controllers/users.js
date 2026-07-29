import Users from '../models/User.js';

export const getAllUsers = async (req, res, next) => {
    try {
        const { name, email } = req.query;
        const filter = {};
        if (name) filter.name = name;
        if (email) filter.email = email;

        const users = await Users.find();
        res.status(200).json(users);
    } catch (err) {
        next(err);
    }
};

export const getUserById = async (req, res, next) => {

};

export const createUser = async (req, res, next) => {

};

export const updateUser = async (req, res, next) => {

};

export const updateUserRole = async (req, res, next) => {

};

export const deleteUser = async (req, res, next) => {

};