import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ authProvider: 'github', providerId: profile.id });
        if (!user) {
            user = await User.create({
                name: profile.displayName || profile.username,
                email: profile.emails?.[0]?.value,
                authProvider: 'github',
                providerId: profile.id,
                role: 'customer'
            });
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

export default passport;