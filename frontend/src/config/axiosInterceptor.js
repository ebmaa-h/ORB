import axiosClient from '../config/axiosClient';

axiosClient.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;
    console.log('response',response)

    if (
      response &&
      response.status === 401 &&
      response.data?.code === 'SESSION_INVALID'
    ) {

      window.location.href = '/not-found?reason=session-expired';
      window.location.reload();
    }

    return Promise.reject(error);
  }
);
