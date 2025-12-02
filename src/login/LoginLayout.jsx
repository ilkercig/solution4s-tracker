import { useMediaQuery, Paper, Typography, Box } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import LogoImage from './LogoImage';

const useStyles = makeStyles()((theme) => ({
  root: {
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(8),
    alignItems: 'center',
    [theme.breakpoints.down('lg')]: {
      gap: theme.spacing(6),
    },
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: '1fr',
      gap: theme.spacing(4),
    },
  },
  brandSection: {
    textAlign: 'center',
    paddingTop: theme.spacing(8),
    [theme.breakpoints.up('lg')]: {
      textAlign: 'left',
      paddingTop: 0,
    },
  },
  logoContainer: {
    marginBottom: theme.spacing(4),
    '& > div': {
      maxWidth: '500px',
      margin: '0 auto',
      [theme.breakpoints.up('lg')]: {
        margin: 0,
      },
    },
  },
  brandContent: {
    marginTop: theme.spacing(3),
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 300,
    color: '#111827',
    marginBottom: theme.spacing(2),
    letterSpacing: '-0.02em',
    [theme.breakpoints.down('lg')]: {
      fontSize: '2rem',
    },
  },
  description: {
    fontSize: '1.125rem',
    fontWeight: 300,
    color: '#6B7280',
    lineHeight: 1.7,
    maxWidth: '500px',
    margin: '0 auto',
    marginBottom: theme.spacing(3),
    [theme.breakpoints.up('lg')]: {
      margin: 0,
      marginBottom: theme.spacing(3),
    },
  },
  featureList: {
    marginTop: theme.spacing(3),
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
    justifyContent: 'center',
    [theme.breakpoints.up('lg')]: {
      justifyContent: 'flex-start',
    },
  },
  featureDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#6AC23F',
    borderRadius: '50%',
    flexShrink: 0,
  },
  featureText: {
    color: '#374151',
    fontWeight: 500,
    fontSize: '0.9375rem',
  },
  formSection: {
    display: 'flex',
    justifyContent: 'center',
    [theme.breakpoints.up('lg')]: {
      justifyContent: 'flex-end',
    },
  },
  formCard: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: theme.spacing(4),
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: theme.spacing(4),
  },
  formTitle: {
    fontSize: '1.5rem',
    fontWeight: 500,
    color: '#111827',
    marginBottom: theme.spacing(1),
  },
  formSubtitle: {
    fontSize: '0.875rem',
    color: '#6B7280',
  },
  form: {
    width: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: theme.spacing(4),
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.75rem',
    color: '#9CA3AF',
  },
}));

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();
  const theme = useTheme();

  return (
    <main className={classes.root}>
      <div className={classes.container}>
        <div className={classes.grid}>
          {/* Left Side - Brand & Features */}
          <div className={classes.brandSection}>
            <div className={classes.logoContainer}>
              <LogoImage color={theme.palette.primary.main} />
            </div>
            <div className={classes.brandContent}>
              <Typography className={classes.title}>
                Takip Portalı
              </Typography>
              <Typography className={classes.description}>
                Solution4s Takip Portalı'na hoş geldiniz. 
                Araçlarınızı kolayca takip edin ve yönetin.
              </Typography>
              <div className={classes.featureList}>
                <div className={classes.featureItem}>
                  <div className={classes.featureDot} />
                  <span className={classes.featureText}>Gerçek zamanlı konum takibi</span>
                </div>
                <div className={classes.featureItem}>
                  <div className={classes.featureDot} />
                  <span className={classes.featureText}>Detaylı raporlama</span>
                </div>
                <div className={classes.featureItem}>
                  <div className={classes.featureDot} />
                  <span className={classes.featureText}>Profesyonel destek</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className={classes.formSection}>
            <Paper className={classes.formCard} elevation={0}>
              <div className={classes.formHeader}>
                <Typography className={classes.formTitle}>
                  Giriş Yapın
                </Typography>
                <Typography className={classes.formSubtitle}>
                  Hesabınıza giriş yapın
                </Typography>
              </div>
              <form className={classes.form}>
                {children}
              </form>
            </Paper>
          </div>
        </div>
      </div>
      
      <div className={classes.footer}>
        © 2024 Solution4s
      </div>
    </main>
  );
};

export default LoginLayout;
