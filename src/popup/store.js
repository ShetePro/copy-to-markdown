import {
  defaultStorage,
  setChromeStorage,
  storageKey,
} from "../utils/chromeStorage.js";

const settingStore = () => {
  let state = {
    ...defaultStorage,
  };
  const action = {
    changeSetting: (newState) => {
      state = Object.assign(state, newState);
      setChromeStorage(storageKey, {
        ...state,
      });
    },
  };
  return () => {
    return [state, action];
  };
};
export default settingStore();
