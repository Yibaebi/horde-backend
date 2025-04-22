import { Router } from 'express';

import { formatSuccessResponse } from '@/utils/response';
import { Theme, CurrencyOptions, DateFormat, TimeFormat, type IUserProps } from '@/types';

const userConfigurationRouter = Router();

// User preferences route
userConfigurationRouter.get('/preferences', async (req, res) =>
  res.json(
    formatSuccessResponse({
      message: 'Preferences retrieved successfully.',
      data: (req.user as IUserProps).preferences,
    })
  )
);

// Get user config defaults
userConfigurationRouter.get('/options', async (_req, res) => {
  const userDefaultConfigs = {
    themes: Theme,
    currencies: CurrencyOptions,
    dateFormats: DateFormat,
    timeFormats: TimeFormat,
  };

  const configOptions = Object.keys(userDefaultConfigs).reduce(
    (configs, currKey) => ({
      ...configs,
      [currKey]: Object.values(userDefaultConfigs[currKey as keyof typeof userDefaultConfigs]),
    }),
    {}
  );

  return res.json(
    formatSuccessResponse({
      message: 'Retrieved User Config Successfully.',
      data: configOptions,
    })
  );
});

export default userConfigurationRouter;
