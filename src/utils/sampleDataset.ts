/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PT. ANUGERAH TERANG PERSADA — ACTUAL WO DATASET
 * Built according to the actual operational spreadsheet structure
 */

export const FULL_88_COLUMNS = [
  'CUST_ACCT',
  'Customer Name',
  'Address',
  'Job Type',
  'Job Task',
  'SCH Date',
  'SCH Time',
  'Installer',
  'Routing',
  'Stat GD',
  'STAT_GT',
  'Stat GC',
  'Confirmation Status',
  'monitoring Remark',
  'Result Choice',
  'Result Remark',
  'Jenis Jaringan',
  'START',
  'FINISH',
  'Branch',
  'WIP Comment',
  'OFFERNUM',
  'SITE_ID',
  'FIBERNODE',
  'MKTTYPE',
  'WORDER',
  'Contractor',
  'Report Date',
  'Report By',
  'Update Date',
  'Update By',
  'CloseDate',
  'Close Status WOM',
  'LATITUDE',
  'LONGITUDE',
];

/**
 * 8 Actual Baseline Records directly provided by PT. Anugerah Terang Persada
 */
export const ACTUAL_ATP_8_RECORDS = [
  {
    CUST_ACCT: '10008306',
    OFFERNUM: '10008306',
    Customer_Name: 'SUGIYATI .',
    'Customer Name': 'SUGIYATI .',
    Address: 'DASANA INDAH DASANA INDAH BLOK UG1 NO. 21 LEGOK KAB. TANGERANG 15820',
    'Job Type': 'SR',
    'Job Task': 'COLLECT CPE',
    jobType: 'SR',
    jobTask: 'COLLECT CPE',
    'SCH Date': '1/1/2025',
    'SCH Time': '09:00-12:00',
    schDate: '2025-01-01',
    schTime: '09:00-12:00',
    Installer: 'AC56',
    installer: 'AC56',
    Routing: '2',
    'Stat GD': '',
    STAT_GT: '',
    'Stat GC': '',
    'Confirmation Status': '',
    'monitoring Remark': '',
    'Result Choice': 'COMPLETE',
    resultChoice: 'COMPLETE',
    'Result Remark': 'COMPLETE - COLLECT STB MDM RTR DCD EMBOS OK \nSTB: 234570355355/079280881526\nMDM: 7CB21BAAE1F2\nRTR: TR53111000372\nNB HANYA ADA CPE TERSEBUT SAJA \nTikor: -6.269012, 106.591234',
    resultRemark: 'COMPLETE - COLLECT STB MDM RTR DCD EMBOS OK \nSTB: 234570355355/079280881526\nMDM: 7CB21BAAE1F2\nRTR: TR53111000372\nNB HANYA ADA CPE TERSEBUT SAJA \nTikor: -6.269012, 106.591234',
    'Jenis Jaringan': 'HFC',
    Jenis_Jaringan: 'HFC',
    networkType: 'HFC',
    START: '11:06',
    start: '11:06',
    FINISH: '11:08',
    finish: '11:08',
    Branch: 'TANGERANG',
    'WIP Comment': 'COLLECT CPE - GPON: ; - Comment: - ODN_type:',
    wipComment: 'COLLECT CPE - GPON: ; - Comment: - ODN_type:',
    'Close Status WOM': 'CLOSED',
    closeStatusWOM: 'CLOSED',
    'Report Date': '2025-01-01 11:15:00',
    'Update Date': '2025-01-01 11:20:00',
    CloseDate: '2025-01-01 12:00:00',
    LATITUDE: -6.269012,
    LONGITUDE: 106.591234,
  },
  {
    CUST_ACCT: '10069289',
    OFFERNUM: '10069289',
    Customer_Name: 'EROY .',
    'Customer Name': 'EROY .',
    Address: 'MUTIARA TAMAN PALEM RUKO MUTIARA TAMAN PALEM BLOK C19 NO. 17 CENGKARENG KOTA JAKARTA BARAT 11730',
    'Job Type': 'SR',
    'Job Task': 'COLLECT CPE',
    jobType: 'SR',
    jobTask: 'COLLECT CPE',
    'SCH Date': '1/1/2025',
    'SCH Time': '09:00-12:00',
    schDate: '2025-01-01',
    schTime: '09:00-12:00',
    Installer: 'AC07',
    installer: 'AC07',
    Routing: '8',
    'Stat GD': '13-15:00',
    STAT_GT: '',
    'Stat GC': '',
    'Confirmation Status': 'Offline',
    'monitoring Remark': '09:47 KONFIRMASI OUTBOUND | 087869081xxx offline -Bella',
    'Result Choice': 'PENDING',
    resultChoice: 'PENDING',
    'Result Remark': 'PENDING - teknisi visit sudah di lokasi namun tech hanya bertemu karyawan cst saja&info cst sedang di luar kota jika sudah di lokasi akan konfirmasi ulang ke pihak FM &info dispet sonya no offline\nn/b:dcd+embos ok\nTikor: -6.143210, 106.732940',
    resultRemark: 'PENDING - teknisi visit sudah di lokasi namun tech hanya bertemu karyawan cst saja&info cst sedang di luar kota jika sudah di lokasi akan konfirmasi ulang ke pihak FM &info dispet sonya no offline\nn/b:dcd+embos ok\nTikor: -6.143210, 106.732940',
    'Jenis Jaringan': 'HFC',
    Jenis_Jaringan: 'HFC',
    networkType: 'HFC',
    START: '14:33',
    start: '14:33',
    FINISH: '14:36',
    finish: '14:36',
    Branch: 'WEST',
    'WIP Comment': 'COLLECT CPE - GPON: ; - Comment: - ODN_type:',
    wipComment: 'COLLECT CPE - GPON: ; - Comment: - ODN_type:',
    'Close Status WOM': 'PENDING',
    closeStatusWOM: 'PENDING',
    'Report Date': '2025-01-01 14:40:00',
    'Update Date': '2025-01-01 14:45:00',
    CloseDate: '2025-01-01 17:00:00',
    LATITUDE: -6.143210,
    LONGITUDE: 106.732940,
  },
  {
    CUST_ACCT: '10085210',
    OFFERNUM: '10085210',
    Customer_Name: 'FIRMANSYAH',
    'Customer Name': 'FIRMANSYAH',
    Address: 'BALEKAMBANG YAHYA NO. 59 KRAMAT JATI KOTA JAKARTA TIMUR 13530',
    'Job Type': 'SR',
    'Job Task': 'DISMANTLE CABLE DROP',
    jobType: 'SR',
    jobTask: 'DISMANTLE CABLE DROP',
    'SCH Date': '1/1/2025',
    'SCH Time': 'Anytime',
    schDate: '2025-01-01',
    schTime: 'Anytime',
    Installer: 'AB05',
    installer: 'AB05',
    Routing: '20',
    'Stat GD': '',
    STAT_GT: '',
    'Stat GC': '',
    'Confirmation Status': '',
    'monitoring Remark': '',
    'Result Choice': 'COMPLETE',
    resultChoice: 'COMPLETE',
    'Result Remark': 'COMPLETE - DISC CABLE DROP OK + PERAPIHAN OK + PASANG EMBOS OK + 1 TIES OK\nTikor: -6.273105, 106.858210',
    resultRemark: 'COMPLETE - DISC CABLE DROP OK + PERAPIHAN OK + PASANG EMBOS OK + 1 TIES OK\nTikor: -6.273105, 106.858210',
    'Jenis Jaringan': 'HFC',
    Jenis_Jaringan: 'HFC',
    networkType: 'HFC',
    START: '12:20',
    start: '12:20',
    FINISH: '12:20',
    finish: '12:20',
    Branch: 'SOUTH',
    'WIP Comment': 'DISC CABLE DROP - GPON: ; - Comment: - ODN_type:',
    wipComment: 'DISC CABLE DROP - GPON: ; - Comment: - ODN_type:',
    'Close Status WOM': 'CLOSED',
    closeStatusWOM: 'CLOSED',
    'Report Date': '2025-01-01 12:30:00',
    'Update Date': '2025-01-01 12:35:00',
    CloseDate: '2025-01-01 13:00:00',
    LATITUDE: -6.273105,
    LONGITUDE: 106.858210,
  },
  {
    CUST_ACCT: '10097610',
    OFFERNUM: '10097610',
    Customer_Name: 'BUDI SIRAJUL MUNIR',
    'Customer Name': 'BUDI SIRAJUL MUNIR',
    Address: 'BALEKAMBANG HAJI USMAN NO. 71 KRAMAT JATI 008/03 KOTA JAKARTA TIMUR 13530',
    'Job Type': 'SR',
    'Job Task': 'DISMANTLE CABLE DROP',
    jobType: 'SR',
    jobTask: 'DISMANTLE CABLE DROP',
    'SCH Date': '1/1/2025',
    'SCH Time': 'Anytime',
    schDate: '2025-01-01',
    schTime: 'Anytime',
    Installer: 'AB02',
    installer: 'AB02',
    Routing: '16',
    'Stat GD': '',
    STAT_GT: '',
    'Stat GC': '',
    'Confirmation Status': '',
    'monitoring Remark': '',
    'Result Choice': 'COMPLETE',
    resultChoice: 'COMPLETE',
    'Result Remark': 'COMPLETE - DISC CABLE DROP OK + PERAPIHAN OK + PEMASANGAN EMBOSE OK\nTikor: -6.274520, 106.859640',
    resultRemark: 'COMPLETE - DISC CABLE DROP OK + PERAPIHAN OK + PEMASANGAN EMBOSE OK\nTikor: -6.274520, 106.859640',
    'Jenis Jaringan': 'HFC',
    Jenis_Jaringan: 'HFC',
    networkType: 'HFC',
    START: '10:46',
    start: '10:46',
    FINISH: '10:46',
    finish: '10:46',
    Branch: 'SOUTH',
    'WIP Comment': 'DISC CABLE DROP - GPON: ; - Comment: - ODN_type:',
    wipComment: 'DISC CABLE DROP - GPON: ; - Comment: - ODN_type:',
    'Close Status WOM': 'CLOSED',
    closeStatusWOM: 'CLOSED',
    'Report Date': '2025-01-01 10:55:00',
    'Update Date': '2025-01-01 11:00:00',
    CloseDate: '2025-01-01 11:30:00',
    LATITUDE: -6.274520,
    LONGITUDE: 106.859640,
  },
  {
    CUST_ACCT: '10117225',
    OFFERNUM: '10117225',
    Customer_Name: 'BERLIAN TAMBUNAN .',
    'Customer Name': 'BERLIAN TAMBUNAN .',
    Address: 'PALEM GANDA ASRI 1 PALEM GANDA ASRI 1 BLOK C1A NO. 01 KARANG TENGAH KOTA TANGERANG 15157',
    'Job Type': 'SR',
    'Job Task': 'COLLECT CPE',
    jobType: 'SR',
    jobTask: 'COLLECT CPE',
    'SCH Date': '1/1/2025',
    'SCH Time': '13:00-15:00',
    schDate: '2025-01-01',
    schTime: '13:00-15:00',
    Installer: 'AC21',
    installer: 'AC21',
    Routing: '1',
    'Stat GD': '9:00-12:00',
    STAT_GT: '',
    'Stat GC': '',
    'Confirmation Status': 'NBP',
    'monitoring Remark': '08:26 KONFIRMASI OUTBOUND | 082123419xxx 3x NBP -Bella',
    'Result Choice': 'COMPLETE',
    resultChoice: 'COMPLETE',
    'Result Remark': 'COMPLETE - COLL:MODEM\nMODEM:285B0C15126E\nNB:NO DISC CABEL DROOP SDH TERLEPAS DARI TAP&DILOKASI HANYA ADA ALAT TERSEBUT&CST TDK BERSEDIA DI FOTO\nTikor: -6.216340, 106.711820',
    resultRemark: 'COMPLETE - COLL:MODEM\nMODEM:285B0C15126E\nNB:NO DISC CABEL DROOP SDH TERLEPAS DARI TAP&DILOKASI HANYA ADA ALAT TERSEBUT&CST TDK BERSEDIA DI FOTO\nTikor: -6.216340, 106.711820',
    'Jenis Jaringan': 'HFC',
    Jenis_Jaringan: 'HFC',
    networkType: 'HFC',
    START: '16:30',
    start: '16:30',
    FINISH: '16:34',
    finish: '16:34',
    Branch: 'WEST',
    'WIP Comment': 'COLLECT CPE - GPON: ; - Comment: - ODN_type:',
    wipComment: 'COLLECT CPE - GPON: ; - Comment: - ODN_type:',
    'Close Status WOM': 'CLOSED',
    closeStatusWOM: 'CLOSED',
    'Report Date': '2025-01-01 16:40:00',
    'Update Date': '2025-01-01 16:45:00',
    CloseDate: '2025-01-01 17:30:00',
    LATITUDE: -6.216340,
    LONGITUDE: 106.711820,
  },
  {
    CUST_ACCT: '10163009',
    OFFERNUM: '10163009',
    Customer_Name: 'BUDI HARAYADI .',
    'Customer Name': 'BUDI HARAYADI .',
    Address: 'SAHID SUDIRMAN RESIDENCE 22 FL X KH MAS MANSYUR NO. TANAH ABANG KOTA JAKARTA PUSAT 10220',
    'Job Type': 'SR',
    'Job Task': 'COLLECT CPE',
    jobType: 'SR',
    jobTask: 'COLLECT CPE',
    'SCH Date': '1/1/2025',
    'SCH Time': '13:00-15:00',
    schDate: '2025-01-01',
    schTime: '13:00-15:00',
    Installer: 'AB101',
    installer: 'AB101',
    Routing: '1',
    'Stat GD': '9:00-12:00',
    STAT_GT: '',
    'Stat GC': '',
    'Confirmation Status': 'NBP',
    'monitoring Remark': 'PROGRESS CALL GD\n\n8.10 KONF OUTB | 08197668990 nbp -dian ',
    'Result Choice': 'CANCEL',
    resultChoice: 'CANCEL',
    'Result Remark': 'CANCEL - TEKNISI VISIT KELOKASI NO PERMIT KARENA TIM TIDAK ADA AKSES INFO RECEPTIONS UNIT SUDAH KOSONG INFI DARI MBA DIAH AGENT UNIT KOSONG DAN DI UNIT SUDAH TIDAK ADA MODEM FM KONFIRMASI DISPATCH ANGGRI PH NBP\nNB : NO DISC CABEL DROP+EMBOS FTTH AREA \nTikor: -6.208810, 106.820240',
    resultRemark: 'CANCEL - TEKNISI VISIT KELOKASI NO PERMIT KARENA TIM TIDAK ADA AKSES INFO RECEPTIONS UNIT SUDAH KOSONG INFI DARI MBA DIAH AGENT UNIT KOSONG DAN DI UNIT SUDAH TIDAK ADA MODEM FM KONFIRMASI DISPATCH ANGGRI PH NBP\nNB : NO DISC CABEL DROP+EMBOS FTTH AREA \nTikor: -6.208810, 106.820240',
    'Jenis Jaringan': 'FTTH',
    Jenis_Jaringan: 'FTTH',
    networkType: 'FTTH',
    START: '14:49',
    start: '14:49',
    FINISH: '14:50',
    finish: '14:50',
    Branch: 'WEST',
    'WIP Comment': 'COLLECT CPE - GPON:ZTE ;100 - Comment: - ODN_type: KONVENSIONAL',
    wipComment: 'COLLECT CPE - GPON:ZTE ;100 - Comment: - ODN_type: KONVENSIONAL',
    'Close Status WOM': 'CANCELLED',
    closeStatusWOM: 'CANCELLED',
    'Report Date': '2025-01-01 15:00:00',
    'Update Date': '2025-01-01 15:05:00',
    CloseDate: '2025-01-01 16:00:00',
    LATITUDE: -6.208810,
    LONGITUDE: 106.820240,
  },
  {
    CUST_ACCT: '10207797',
    OFFERNUM: '10207797',
    Customer_Name: 'SDN ULUJAMI 02 PAGI .',
    'Customer Name': 'SDN ULUJAMI 02 PAGI .',
    Address: 'SDN ULU JAMI 02 PAGI ULUJAMI SWADARMA RAYA NO. ?-96 PESANGGRAHAN KOTA JAKARTA SELATAN 12250',
    'Job Type': 'SR',
    'Job Task': 'COLLECT CPE',
    jobType: 'SR',
    jobTask: 'COLLECT CPE',
    'SCH Date': '1/1/2025',
    'SCH Time': '09:00-12:00',
    schDate: '2025-01-01',
    schTime: '09:00-12:00',
    Installer: 'AB96',
    installer: 'AB96',
    Routing: '11',
    'Stat GD': '15-17:30',
    STAT_GT: '',
    'Stat GC': '',
    'Confirmation Status': 'Offline',
    'monitoring Remark': 'PROGRESS CALL GD\n\n11.10 KONF OUTB | 5860054 offline, 085289892120 offline -dian ',
    'Result Choice': 'PENDING',
    resultChoice: 'PENDING',
    'Result Remark': 'PENDING - TEKNISI VISIT SUDAH DIDEPAN RUMAH DAN MEMANGGIL NAMUN CST NO RESPON\nNB : NO DISC CABLE DROP SUDAH TERLEPAS DARI TAB\nTikor: -6.248320, 106.764510',
    resultRemark: 'PENDING - TEKNISI VISIT SUDAH DIDEPAN RUMAH DAN MEMANGGIL NAMUN CST NO RESPON\nNB : NO DISC CABLE DROP SUDAH TERLEPAS DARI TAB\nTikor: -6.248320, 106.764510',
    'Jenis Jaringan': 'HFC',
    Jenis_Jaringan: 'HFC',
    networkType: 'HFC',
    START: '17:45',
    start: '17:45',
    FINISH: '17:50',
    finish: '17:50',
    Branch: 'WEST',
    'WIP Comment': 'COLLECT CPE - GPON: ; - Comment: REQ SITE ID FROM PORTAL 14092244 - ODN_type:',
    wipComment: 'COLLECT CPE - GPON: ; - Comment: REQ SITE ID FROM PORTAL 14092244 - ODN_type:',
    'Close Status WOM': 'PENDING',
    closeStatusWOM: 'PENDING',
    'Report Date': '2025-01-01 17:55:00',
    'Update Date': '2025-01-01 18:00:00',
    CloseDate: '2025-01-01 19:00:00',
    LATITUDE: -6.248320,
    LONGITUDE: 106.764510,
  },
  {
    CUST_ACCT: '10215912',
    OFFERNUM: '10215912',
    Customer_Name: 'IR  SETYO BUDI SANTOSO .',
    'Customer Name': 'IR  SETYO BUDI SANTOSO .',
    Address: 'NGINGAS DELTA FORTUNA NO. 25 WARU KAB. SIDOARJO 61256',
    'Job Type': 'SR',
    'Job Task': 'COLLECT CPE',
    jobType: 'SR',
    jobTask: 'COLLECT CPE',
    'SCH Date': '1/1/2025',
    'SCH Time': 'Anytime',
    schDate: '2025-01-01',
    schTime: 'Anytime',
    Installer: 'AD48',
    installer: 'AD48',
    Routing: '1',
    'Stat GD': '',
    STAT_GT: '',
    'Stat GC': '',
    'Confirmation Status': '',
    'monitoring Remark': '',
    'Result Choice': 'COMPLETE',
    resultChoice: 'COMPLETE',
    'Result Remark': 'COMPLETE - Report Tanggal : 01 - 01 - 2025\nVisit : 10.19\nFinish : 10.26\n\nAcc : 10215912\nNama : IR SETYO BUDI SANTOSO\nALAMAT : DELTA FORTUNA 25NGINGASWARU SIDOARJO\nJob : SR\nWc : COLLECT CPE\nStatus : DONE\n\nRemake : DONE COLLECT MODEM SKYWORTH 3.0 SN : 14115D0D1EBA + ROUTER SINGLE BAND TP-LINK SN : 2209512012294 + STB X1 PRIME SN : 219130707377 + ADAPTOR 2 + REMOTE 2 + HDMI 1\n\nTikor : -7.363786,112.745709',
    resultRemark: 'COMPLETE - Report Tanggal : 01 - 01 - 2025\nVisit : 10.19\nFinish : 10.26\n\nAcc : 10215912\nNama : IR SETYO BUDI SANTOSO\nALAMAT : DELTA FORTUNA 25NGINGASWARU SIDOARJO\nJob : SR\nWc : COLLECT CPE\nStatus : DONE\n\nRemake : DONE COLLECT MODEM SKYWORTH 3.0 SN : 14115D0D1EBA + ROUTER SINGLE BAND TP-LINK SN : 2209512012294 + STB X1 PRIME SN : 219130707377 + ADAPTOR 2 + REMOTE 2 + HDMI 1\n\nTikor : -7.363786,112.745709',
    'Jenis Jaringan': 'HFC',
    Jenis_Jaringan: 'HFC',
    networkType: 'HFC',
    START: '10:20',
    start: '10:20',
    FINISH: '10:30',
    finish: '10:30',
    Branch: 'SURABAYA',
    'WIP Comment': 'COLLECT CPE - GPON: ; - Comment: - ODN_type:',
    wipComment: 'COLLECT CPE - GPON: ; - Comment: - ODN_type:',
    'Close Status WOM': 'CLOSED',
    closeStatusWOM: 'CLOSED',
    'Report Date': '2025-01-01 10:35:00',
    'Update Date': '2025-01-01 10:40:00',
    CloseDate: '2025-01-01 11:30:00',
    LATITUDE: -7.363786,
    LONGITUDE: 112.745709,
  },
];

/**
 * Returns the exact 8 actual baseline records from PT. Anugerah Terang Persada
 */
export function getActualAtp8Dataset(): Record<string, any>[] {
  return JSON.parse(JSON.stringify(ACTUAL_ATP_8_RECORDS));
}

/**
 * Generates an expanded dataset of 50 records matching the exact operational schema of PT. Anugerah Terang Persada
 */
export function generate50SampleDataset(): Record<string, any>[] {
  const result: Record<string, any>[] = [...getActualAtp8Dataset()];

  const additionalNames = [
    'HENDRA WIJAYA .', 'SITI NURHALIZA .', 'AGUS SETIAWAN', 'RATNA DEWI .', 'BAMBANG PAMUNGKAS',
    'DEWI LESTARI .', 'ANTON SUHARTONO', 'LILIS SURYANI .', 'DENI KURNIAWAN', 'NURUL HIDAYAH .',
    'HERI PURWANTO', 'MEGAWATI SOEKARNO .', 'RIDWAN KAMIL', 'ANIS BASWEDAN', 'SANDIAGA UNO',
    'SRI MULYANI .', 'BASUKI HADIMULJONO', 'TRI RISMAHARINI .', 'GANJAR PRANOWO', 'ERICK THOHIR',
    'YUSUF MANSUR', 'DEDI CORBUZIER', 'RAFFI AHMAD', 'NAGITA SLAVINA .', 'ATTILAH SOERYADJAYA',
    'MAHENDRA SIREGAR', 'SUHARTONO .', 'YANTI SUSANTI .', 'WAHYU HIDAYAT', 'DIAN SASTRO .',
    'NICHOLAS SAPUTRA', 'CHELSEA ISLAN .', 'REZA RAHADIAN', 'PEPPY PRASETYO', 'TITI KAMAL .',
    'CHRISTIAN SUGIONO', 'GADING MARTEN', 'GISELLA ANASTASIA .', 'ANDHIKA PRATAMA', 'USSY SULISTIAWATY .',
    'SULE PRIKITIEW', 'ANDRE TAULANY'
  ];

  const branches = ['TANGERANG', 'WEST', 'SOUTH', 'SURABAYA'];
  const installers = ['AC56', 'AC07', 'AB05', 'AB02', 'AC21', 'AB101', 'AB96', 'AD48', 'AC15', 'AB22', 'AD12'];
  const tasks = ['COLLECT CPE', 'DISMANTLE CABLE DROP', 'TARIK KABEL DROPCORE FTTH', 'PASANG ONT WI-FI 6', 'GANGGUAN REDAMAN TINGGI'];
  const networks: ('FTTH' | 'HFC')[] = ['HFC', 'HFC', 'FTTH', 'FTTH', 'HFC'];

  for (let i = 8; i < 50; i++) {
    const custAcct = `10${String(250000 + i * 137).slice(0, 6)}`;
    const custName = additionalNames[(i - 8) % additionalNames.length];
    const branch = branches[i % branches.length];
    const installer = installers[i % installers.length];
    const task = tasks[i % tasks.length];
    const netType = networks[i % networks.length];

    const baseHour = 8 + (i % 9);
    const startMin = (i * 17) % 50;
    const durMin = (i % 7 === 0) ? 0 : (i % 5 === 0) ? 3 : 25 + (i * 3) % 45; // inject 0 min and short duration edge cases
    const finishMin = (startMin + durMin) % 60;
    const finishHour = baseHour + Math.floor((startMin + durMin) / 60);

    const startStr = `${String(baseHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
    const finishStr = `${String(finishHour).padStart(2, '0')}:${String(finishMin).padStart(2, '0')}`;

    // Locations in Tangerang, Jakarta West, Jakarta South, Surabaya
    let lat = -6.2297;
    let lng = 106.8166;
    if (branch === 'TANGERANG') {
      lat = -6.2163 + ((i % 10) * 0.005);
      lng = 106.6523 + ((i % 10) * 0.006);
    } else if (branch === 'WEST') {
      lat = -6.1754 + ((i % 10) * 0.004);
      lng = 106.7329 + ((i % 10) * 0.005);
    } else if (branch === 'SOUTH') {
      lat = -6.2483 + ((i % 10) * 0.005);
      lng = 106.8456 + ((i % 10) * 0.004);
    } else {
      lat = -7.3637 + ((i % 10) * 0.004);
      lng = 112.7457 + ((i % 10) * 0.005);
    }

    const isCancel = i % 11 === 0;
    const isPending = i % 8 === 0;
    const resultChoice = isCancel ? 'CANCEL' : isPending ? 'PENDING' : 'COMPLETE';
    const closeStatus = isCancel ? 'CANCELLED' : isPending ? 'PENDING' : 'CLOSED';

    const item: Record<string, any> = {
      CUST_ACCT: custAcct,
      OFFERNUM: custAcct,
      Customer_Name: custName,
      'Customer Name': custName,
      Address: `JL. RAYA OPERASIONAL NO. ${i + 1} KEL. AREA BLOK C, ${branch}`,
      'Job Type': 'SR',
      'Job Task': task,
      jobType: 'SR',
      jobTask: task,
      'SCH Date': '1/1/2025',
      'SCH Time': i % 3 === 0 ? 'Anytime' : i % 2 === 0 ? '09:00-12:00' : '13:00-15:00',
      schDate: '2025-01-01',
      schTime: i % 3 === 0 ? 'Anytime' : i % 2 === 0 ? '09:00-12:00' : '13:00-15:00',
      Installer: installer,
      installer: installer,
      Routing: String((i % 18) + 1),
      'Stat GD': i % 4 === 0 ? '9:00-12:00' : '',
      STAT_GT: '',
      'Stat GC': '',
      'Confirmation Status': isCancel || isPending ? 'Offline' : 'Confirmed',
      'monitoring Remark': isCancel ? 'Kendala akses unit pelanggan' : 'Konfirmasi outbound selesai',
      'Result Choice': resultChoice,
      resultChoice: resultChoice,
      'Result Remark': `${resultChoice} - Penanganan teknis tiket di lokasi ${branch} OK. Tikor: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      resultRemark: `${resultChoice} - Penanganan teknis tiket di lokasi ${branch} OK. Tikor: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      'Jenis Jaringan': netType,
      Jenis_Jaringan: netType,
      networkType: netType,
      START: startStr,
      start: startStr,
      FINISH: finishStr,
      finish: finishStr,
      Branch: branch,
      'WIP Comment': `${task} - GPON: ; - Comment: Standar Dispatch - ODN_type:`,
      wipComment: `${task} - GPON: ; - Comment: Standar Dispatch - ODN_type:`,
      'Close Status WOM': closeStatus,
      closeStatusWOM: closeStatus,
      'Report Date': `2025-01-01 ${finishStr}:00`,
      'Update Date': `2025-01-01 ${finishStr}:30`,
      CloseDate: `2025-01-01 ${finishHour + 1}:00:00`,
      LATITUDE: lat,
      LONGITUDE: lng,
    };

    result.push(item);
  }

  return result;
}

/**
 * Historical scale dataset of 1,250 records for full statistical evaluation
 */
export function generate1250HistoricalDataset(): Record<string, any>[] {
  const base50 = generate50SampleDataset();
  const result: Record<string, any>[] = [];

  for (let cycle = 0; cycle < 25; cycle++) {
    for (let i = 0; i < base50.length; i++) {
      const src = base50[i];
      const newIndex = cycle * 50 + i;
      const custAcct = `10${String(300000 + newIndex * 19).slice(0, 6)}`;

      result.push({
        ...src,
        CUST_ACCT: custAcct,
        OFFERNUM: custAcct,
        Address: `${src.Address} (Batch ${cycle + 1})`,
      });
    }
  }

  return result;
}
