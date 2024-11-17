import axios from 'axios';

const API_KEY = 'gsxmRFT8Mi0BpQqWkWruT9OwnjE0ZsN1b/Mryk9NOMc=';
const BASE_URL = 'https://mytanita.eu/de/api';

const tanitaLogin = async (email: string, password: string): Promise<string> => {
    try {
        const response = await axios.post(
            `${BASE_URL}/login`,
            {
                email,
                password,
                type: 'regular_user',
            },
            {
                headers: {
                    'api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data.status !== '0') {
            throw new Error('Login failed');
        }

        return response.data.jwt;
    } catch (error) {
        console.error('Error during Tanita login:', error);
        throw error;
    }
};

const getTanitaUsers = async (jwt: string): Promise<any[]> => {
    try {
        const response = await axios.get(`${BASE_URL}/user-profiles`, {
            params: { timestamp: 0 },
            headers: {
                'api-key': API_KEY,
                'Application-Authorization': `Bearer ${jwt}`,
                'Authorization': 'Basic Og==',
                'Content-Type': 'application/json; charset=utf-8',
            },
        });

        if (response.data.status !== 0) {
            throw new Error('Failed to fetch user profiles');
        }

        return response.data.created; // Devuelve la lista de usuarios.
    } catch (error) {
        console.error('Error fetching Tanita user profiles:', error);
        throw error;
    }
};

const getIdByUserProfileId = (users: any[], userProfileId: number): number | undefined => {
    const user = users.find(user => user.userProfileId === userProfileId);
    return user?.id;
};

const getTanitaMeasurements = async (jwt: string, userProfileId: number, timestamp: number, timestampUpTo: number): Promise<any> => {
    try {
        const response = await axios.get(
            `${BASE_URL}/measurements`,
            {
                params: {
                    timestamp,
                    timestamp_up_to: timestampUpTo,
                },
                headers: {
                    'api-key': API_KEY,
                    'Application-Authorization': `Bearer ${jwt}`,
                    'Authorization': 'Basic Og==',
                },
            }
        );

        if (response.data.status !== 0) {
            throw new Error('Failed to fetch measurements');
        }

        const filteredMeasurements = response.data.created.filter(
            (measurement: any) => measurement.userProfileId === userProfileId
        );

        return filteredMeasurements;

    } catch (error) {
        console.error('Error fetching Tanita measurements:', error);
        throw error;
    }
};

const transformMeasurements = (measurements: any[]): any[] => {
    return measurements.map((entry) => {
        const result: Record<string, any> = {
            date: new Date(entry.datetime * 1000).toISOString(),
        };

        entry.measurementEntries.forEach((measurement: any) => {
            switch (measurement.indicatorAbbrv) {
                case 'weight':
                    result.weight = parseFloat(measurement.value);
                    break;
                case 'bmi':
                    result.bmi = parseFloat(measurement.value);
                    break;
                case 'body_fat':
                    result.body_fat = parseFloat(measurement.value);
                    break;
                case 'visceral_fat':
                    result.visc_fat = parseFloat(measurement.value);
                    break;
                case 'muscle_mass':
                    result.muscle_mass = parseFloat(measurement.value);
                    break;
                case 'muscle_quality':
                    result.muscle_quality = parseFloat(measurement.value);
                    break;
                case 'bone_mass':
                    result.bone_mass = parseFloat(measurement.value);
                    break;
                case 'bmr':
                    result.bmr = parseFloat(measurement.value);
                    break;
                case 'metabolic_age':
                    result.metab_age = parseInt(measurement.value, 10);
                    break;
                case 'body_water':
                    result.body_water = parseFloat(measurement.value);
                    break;
                case 'physique_rating':
                    result.physique_rating = parseInt(measurement.value, 10);
                    break;
                default:
                    break;
            }
        });

        [
            'muscle_mass_right_arm',
            'muscle_mass_left_arm',
            'muscle_mass_right_leg',
            'muscle_mass_left_leg',
            'muscle_mass_trunk',
            'muscle_quality_right_arm',
            'muscle_quality_left_arm',
            'muscle_quality_right_leg',
            'muscle_quality_left_leg',
            'muscle_quality_trunk',
            'body_fat_right_arm',
            'body_fat_left_arm',
            'body_fat_right_leg',
            'body_fat_left_leg',
            'body_fat_trunk',
            'heart_rate',
        ].forEach((field) => {
            result[field] = undefined;
        });

        return result;
    });
};

export const fetchAndTransformMeasurements = async (
    email: string,
    password: string,
    userProfileId: number,
    timestamp: number,
    timestampUpTo: number
): Promise<any[]> => {
    try {
        const jwt = await tanitaLogin(email, password);
        const users = await getTanitaUsers(jwt);

        const id = getIdByUserProfileId(users, userProfileId);
        if (id === undefined) {
            throw new Error(`User ID not found for userProfileId: ${userProfileId}`);
        }

        const rawMeasurements = await getTanitaMeasurements(jwt, id, timestamp, timestampUpTo);

        const measurements = transformMeasurements(rawMeasurements);

        return measurements;
    } catch (error) {
        console.error('Error fetching and transforming measurements:', error);
        throw error;
    }
};
