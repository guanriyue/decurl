import { useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toNavigateSearch } from '../runtime/search';
import { useContextStore } from './SearchStateContext';

export const useConfigureRuntime = (): void => {
  const store = useContextStore();
  const location = useLocation();
  const navigate = useNavigate();

  store.configureRuntime({
    getLocation: () => location,
    navigate: (nextLocation, options) => {
      void navigate(toNavigateSearch(nextLocation), options);
    },
  });

  useLayoutEffect(() => {
    store.locationChanged(location);
  }, [store, location]);
};

