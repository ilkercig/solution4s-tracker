import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffectAsync, useCatch } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const ENABLE_KEY = 'alarm-enable-time';
const DISABLE_KEY = 'alarm-disable-time';

const AlarmTimeDialog = ({
  open, item, onClose, onSave,
}) => {
  const t = useTranslation();
  const [enableTime, setEnableTime] = useState(TIME_OPTIONS[0]);
  const [disableTime, setDisableTime] = useState(TIME_OPTIONS[0]);

  useEffect(() => {
    if (item) {
      setEnableTime(item.attributes?.[ENABLE_KEY] || TIME_OPTIONS[0]);
      setDisableTime(item.attributes?.[DISABLE_KEY] || TIME_OPTIONS[0]);
    }
  }, [item]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{item?.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>{t('deviceConfigAlarmEnableTime')}</InputLabel>
            <Select
              value={enableTime}
              onChange={(e) => setEnableTime(e.target.value)}
              label={t('deviceConfigAlarmEnableTime')}
            >
              {TIME_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>{t('deviceConfigAlarmDisableTime')}</InputLabel>
            <Select
              value={disableTime}
              onChange={(e) => setDisableTime(e.target.value)}
              label={t('deviceConfigAlarmDisableTime')}
            >
              {TIME_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('sharedCancel')}</Button>
        <Button onClick={() => onSave(enableTime, disableTime)} variant="contained">
          {t('sharedSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeviceConfigurationPage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const groupItems = useSelector((state) => state.groups.items);

  const [tab, setTab] = useState(0);
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogState, setDialogState] = useState({ open: false, type: null, item: null });

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const [devicesRes, groupsRes] = await Promise.all([
        fetchOrThrow('/api/devices'),
        fetchOrThrow('/api/groups'),
      ]);
      setDevices(await devicesRes.json());
      setGroups(await groupsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const getDeviceSource = (device) => {
    if (device.attributes?.[ENABLE_KEY]) return 'device';
    const group = groups.find((g) => g.id === device.groupId);
    if (group?.attributes?.[ENABLE_KEY]) return 'group';
    return null;
  };

  const getEffectiveTime = (device, key) => {
    if (device.attributes?.[key]) return device.attributes[key];
    const group = groups.find((g) => g.id === device.groupId);
    return group?.attributes?.[key] || null;
  };

  const openDialog = (type, item) => setDialogState({ open: true, type, item });
  const closeDialog = () => setDialogState({ open: false, type: null, item: null });

  const handleSave = useCatch(async (enableTime, disableTime) => {
    const { type, item } = dialogState;
    const endpoint = type === 'device' ? 'devices' : 'groups';
    const updatedItem = {
      ...item,
      attributes: {
        ...item.attributes,
        [ENABLE_KEY]: enableTime,
        [DISABLE_KEY]: disableTime,
      },
    };
    await fetchOrThrow(`/api/${endpoint}/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem),
    });
    if (type === 'device') {
      setDevices((prev) => prev.map((d) => (d.id === item.id ? updatedItem : d)));
    } else {
      setGroups((prev) => prev.map((g) => (g.id === item.id ? updatedItem : g)));
    }
    closeDialog();
  });

  const handleClear = useCatch(async (type, item) => {
    const endpoint = type === 'device' ? 'devices' : 'groups';
    const updatedAttributes = { ...item.attributes };
    delete updatedAttributes[ENABLE_KEY];
    delete updatedAttributes[DISABLE_KEY];
    const updatedItem = { ...item, attributes: updatedAttributes };
    await fetchOrThrow(`/api/${endpoint}/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem),
    });
    if (type === 'device') {
      setDevices((prev) => prev.map((d) => (d.id === item.id ? updatedItem : d)));
    } else {
      setGroups((prev) => prev.map((g) => (g.id === item.id ? updatedItem : g)));
    }
  });

  const filteredGroups = groups.filter(filterByKeyword(searchKeyword));
  const filteredDevices = devices.filter(filterByKeyword(searchKeyword));

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsDeviceConfiguration']}>
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant="h6">{t('deviceConfigMovementAlarm')}</Typography>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label={t('settingsGroups')} />
        <Tab label={t('deviceTitle')} />
      </Tabs>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />

      {tab === 0 && (
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>{t('sharedName')}</TableCell>
              <TableCell>{t('deviceConfigAlarmEnableTime')}</TableCell>
              <TableCell>{t('deviceConfigAlarmDisableTime')}</TableCell>
              <TableCell className={classes.columnAction} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading ? filteredGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>{group.name}</TableCell>
                <TableCell>{group.attributes?.[ENABLE_KEY] || '—'}</TableCell>
                <TableCell>{group.attributes?.[DISABLE_KEY] || '—'}</TableCell>
                <TableCell className={classes.columnAction} padding="none">
                  <Stack direction="row">
                    <Tooltip title={t('sharedEdit')}>
                      <IconButton size="small" onClick={() => openDialog('group', group)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {group.attributes?.[ENABLE_KEY] && (
                      <Tooltip title={t('deviceConfigClearSchedule')}>
                        <IconButton size="small" onClick={() => handleClear('group', group)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            )) : (<TableShimmer columns={4} endAction />)}
          </TableBody>
        </Table>
      )}

      {tab === 1 && (
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>{t('sharedName')}</TableCell>
              <TableCell>{t('groupParent')}</TableCell>
              <TableCell>{t('deviceConfigAlarmEnableTime')}</TableCell>
              <TableCell>{t('deviceConfigAlarmDisableTime')}</TableCell>
              <TableCell>{t('deviceConfigSource')}</TableCell>
              <TableCell className={classes.columnAction} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading ? filteredDevices.map((device) => {
              const source = getDeviceSource(device);
              return (
                <TableRow key={device.id}>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{device.groupId ? groupItems[device.groupId]?.name : '—'}</TableCell>
                  <TableCell>{getEffectiveTime(device, ENABLE_KEY) || '—'}</TableCell>
                  <TableCell>{getEffectiveTime(device, DISABLE_KEY) || '—'}</TableCell>
                  <TableCell>
                    {source === 'device' && (
                      <Chip label={t('deviceConfigSourceDevice')} color="primary" size="small" />
                    )}
                    {source === 'group' && (
                      <Chip label={t('deviceConfigSourceGroup')} size="small" />
                    )}
                  </TableCell>
                  <TableCell className={classes.columnAction} padding="none">
                    <Stack direction="row">
                      <Tooltip title={t('sharedEdit')}>
                        <IconButton size="small" onClick={() => openDialog('device', device)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {source === 'device' && (
                        <Tooltip title={t('deviceConfigClearSchedule')}>
                          <IconButton size="small" onClick={() => handleClear('device', device)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            }) : (<TableShimmer columns={6} endAction />)}
          </TableBody>
        </Table>
      )}

      <AlarmTimeDialog
        open={dialogState.open}
        item={dialogState.item}
        onClose={closeDialog}
        onSave={handleSave}
      />
    </PageLayout>
  );
};

export default DeviceConfigurationPage;
