import { axiosi } from "../../config/axios";

export const addAddress = async (address) => {
    const res = await axiosi.post("/address", address);
    return res.data;
};

export const fetchAddressByUserId = async (id) => {
    const res = await axiosi.get(`/address/user/${id}`);
    return res.data;
};

export const updateAddressById = async (update) => {
    const res = await axiosi.patch(`/address/${update._id}`, update);
    return res.data;
};

export const deleteAddressById = async (id) => {
    const res = await axiosi.delete(`/address/${id}`);
    return res.data;
};
