export const orderListParams = ({ orderType, status, search, time } = {}) => {
  const params = {};
  if (orderType) params.orderType = orderType;
  if (status) params.status = status;
  if (search) params.search = search;
  if (time) params.time = time;
  return params;
};
