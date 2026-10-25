'use server';

import db from "..";

interface InfoDNI {
    message: string;
    lista: { nombresapellidos: string }[]
}

interface InfoRuc {
    success: boolean;
    result: {
        ruc: string;
        name: string;
        address: string;
        status: string;
    };
}

export const getInfoDocumento = async (tipo: string, documento: string) => {

    try {
        // const existe = await db.query.clienteReservante.findFirst({
        //     where: (huesped, { eq }) => eq(huesped.numeroDocumento, documento),
        // });

        // if (existe) {
        //     return { ok: true, msg: 'Se encontro al usuario', data: existe, isCurrent: true };
        // }

        const tipoDocumento = await db.query.tipoDocumento.findFirst({
            where: { id: tipo },
        });

        if (!tipoDocumento) return { ok: false, msg: 'Tipo de documento no válido' };

        if (tipoDocumento.nombre === 'DNI') {
            const response = await fetch(`https://ww1.sunat.gob.pe/ol-ti-itfisdenreg/itfisdenreg.htm?accion=obtenerDatosDni&numDocumento=${documento}`);
            const data: InfoDNI = await response.json();
            if (data.message === 'success') {
                const nombresApellidos = data.lista[0].nombresapellidos;
                const normalizeData = nombresApellidos.split(',');
                const apellidos = normalizeData[0].trim();
                const nombres = normalizeData[1].trim();
                return { ok: true, msg: 'data obtenida correctamente', data: { nombres, apellidos }, isDNI: true };
            }
            return { ok: false, msg: 'No se pudo obtener la información del DNI' };
        }
        if (tipoDocumento.nombre === 'RUC') {
            const response = await fetch(`https://www.dsgperutech.com/api-customer/v1/ruc/${documento}`);
            // {"success":true,"result":{"ruc":"20564517659","name":"SOL DEL CUSCO PERU S.R.L.","address":"AV. TULLUMAYO NRO 872 ","status":"OK"}}
            const data: InfoRuc = await response.json();
            if (!data.success) {
                return { ok: false, msg: 'No se encontro el RUC' };
            }

            return { ok: true, msg: 'data obtenida correctamente', data: data.result, isRuc: true };
        }

        // console.log(data);
    } catch (e) {
        return { ok: false, msg: 'Revise su conexión a internet' };
    }
}


export const getRucBusiness = async (ruc: string) => {
    try {
        const response = await fetch(`https://www.dsgperutech.com/api-customer/v1/ruc/${ruc}`);
        // {"success":true,"result":{"ruc":"20564517659","name":"SOL DEL CUSCO PERU S.R.L.","address":"AV. TULLUMAYO NRO 872 ","status":"OK"}}
        // console.log(response);
        const data: InfoRuc = await response.json();

        if (!data.success) {
            return { ok: false, msg: 'No se encontro el RUC' };
        }

        return { ok: true, msg: 'data obtenida correctamente', data: data.result };
    } catch (e) {
        return { ok: false, msg: 'Revise su conexión a internet' };
    }
}