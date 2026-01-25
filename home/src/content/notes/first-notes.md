---
title: Switching to GrapheneOS
preview: Documenting the experience of switching to GrapheneOS
date: 2026-01-21
---

For quite some time I've had the goal of trying to regain ownership of my digital life, something which has proved very difficult in an era of software-as-a-service where you pay with your data. In practice, this hasn't meant a Richard Stallman-style total abstinence from modern services, but it has meant finding ways to move little things here and there more into my own control. 

I already moved away from Gmail a few years ago in a full swap to Proton Mail, which has been largely fantastic[^1].

iPhones are fantastic pieces of hardware, and have become much more usable the past few years, but I have too many tools I love on Android that iOS would lock me out of.

- Improved security and reduced tracking
- A better battery life
- Less dependence on Google
- Less AI slop[^2]

### Is this necessary?

Realistically, for the risk profile I personally face? No, probably not. Graphene's extreme hardening is usually aimed at folks with high-risk profiles, where sending literally any data to a big-tech company could result in either direct or indirect harm. Think [Edward Snowden](https://nitter.net/Snowden/status/1588472045960327168). It's also aimed at folks wanting to completely strip not just Google, but any big-tech company, out of their lives.

I don't see myself becoming an enemy of the state[^3], and I don't see a realistic near future for myself without any connection to big tech in Current Year. However, I do see a benefit to reasonable amounts of increased security. Using Graphene isn't as intense of a switch as trying some of the high-security Linux phones with the barest minimum of features, although it gives you the option to use it as such. With the way I'll be using it, it's as intense of a switch as locking the front door at night, and that's fine by me.

Also, let's not get it twisted about the real reason: it *is* kinda fun installing a custom Android ROM.

## The install process

Installing the OS was shockingly easy! The maintainers have a [fantastic guide on their site](https://grapheneos.org/install) for a more detailed overview. After unboxing my phone, I ran through the initial setup process in Android, then made my way to settings and enabled the developer options. This let me unlock the bootloader, a security feature for Android that prevents people who may happen their way into your phone from rewriting it for one reason or another.

Once the bootloader was unlocked, I rebooted my phone into safe mode, and plugged it into my PC. The folks at Graphene have done an awesome job at making the installation super easy. Integrated into the install guide are buttons that will detect your (unlocked) phone via USB, automatically download the correct version of the OS, and install it. This took about half an hour all-in, including the time to download the roughly 1.5 GB OS.

Graphene is based on Android, so the OS onboarding was almost identical to the default setup you're used to, although with some features stripped out. Most of Graphene's security benefits come from the removal of features.

## De-Googling apps

As I mentioned, by default, Graphene comes *super* stripped down. It has calling, texting, a calculator, a file manager, some info about the OS, and their own app store which has a total of no more than ten apps on it. Connection to Google via the Play Store and Play Services wasn't even pre-installed, and was a separate, opt-in toggle via the app store. It's kind of astonishing seeing a phone come out of the box so empty.

With effectively no Google-enabled defaults on the phone, I thought it beneficial to explore the available alternatives. I installed two "primary use" app stores on the superuser account, those being [F-Droid](https://f-droid.org/en/) and [Aurora Store](https://auroraoss.com). F-Droid is an alternate app store with a focus on FOSS apps. Aurora Store is a proxy to the Google Play store, using a pool of anonymous Google accounts to siphon over installations of non-free[^7] apps.

For phone calls, texting, and contacts, I installed [Fossify](https://www.fossify.org/apps) via the F-Droid store. The stock Graphene apps work, but I personally prefer the design of the Fossify apps. I also set up syncing of contacts with [my Synology NAS](https://www.synology.com/en-global/dsm/feature/contacts) and my photos using [Synology Photos](https://www.synology.com/en-global/dsm/feature/photos). I enjoy the idea of my data being stored in a box in my room instead of in a box in someone else's room.

[NOTE TO SELF: What else did you do?]

### Thanks for Progressive Web Apps!

[NOTE TO SELF: What could be moved to a PWA? Sling?]

### Two key "keeps"

While my goal was to remove as many Google services as possible from my phone, I wasn't able to *completely* do so without a decrease in quality of life. On my (present) setup I still have YouTube and Google Maps.

While alternatives to YouTube exist, like [NewPipe](https://newpipe.net) and [GrayJay](https://grayjay.app), I found the user experience on those apps very gimped. I've been using [the ReVanced project](https://revanced.app) for years, and continued using that. It has some reductions in phoning home, features I can't imagine living without like [SponsorBlock](https://addons.mozilla.org/en-US/firefox/addon/sponsorblock), and anti-features I can't imagine living without like the removal of YouTube Shorts and AI-generated summaries of videos and comments. ReVanced also uses microG by default, even on stock Android.

I'm also keeping a *very, very locked-down* Google Maps. The primary alternative to Google Maps people pitched is [Organic Maps](https://organicmaps.app), a *really* cool open-source offline mapping app primarily aimed at outdoors-y folks. I'm very evidently not that, but Organic Maps is still a fascinating project even if that's not your speed. The issue I had with Organic Maps is there's no way to set personal landmarks, something which I like doing a lot, and there's no support for public transit, which I am a frequent user of. I set Google Maps to use microG, minimized its location access and history[^6], and am continuing to use it until I find a suitable alternative.

## Containers

I watched [this video](https://www.youtube.com/watch?v=dPXu-XKxBT4&t=214s) from a gentleman who sets up GrapheneOS installs for journalists, and one of the main things he recommended was utilizing Android's user functionality as containers for different use cases. This reduces the amount of data that a malicious actor in a single profile could have access to.

One nice thing is that the "containerization" approach uses a user-profile feature already in stock Android. Graphene gives a *lot* more control over it than stock Android, but it exists there. If any of the benefits of this approach seem interesting to you, and you have an Android phone, just try it!

### Superuser

This one exists purely to install apps to the other profiles, so we don't have to have Play Services and app stores on the other accounts.

### Primary

This is the main profile I plan to use, with all my every-day carry apps inside.

One nice thing about Graphene is that, if you do choose to use Play Services, you can toggle it on or off on a per-app basis. For example...

I also set some apps up with microG, a spoofed version of Play Services.

### Finances

The gentleman who suggested containerization also suggested having a separate profile for your finance apps, which I loved and stole. In my prep for this switch, support for finance apps was a consistent barrier to entry for many folks. Graphene doesn't support tap-to-pay at all,[^4] which I personally see as more of a feature than a drawback, and the lack of Play services causes some apps to break completely. I found this true for the apps for one of my banks, as well as for Venmo. I also found that one of my banks had a checker to see if it was installed from the Play Store built in, so I had to install it from the Play Store, then siphon that install into the account.

### Meta Slop

Unfortunately, as a person employed at least partially in the arts, Instagram is a non-negotiable networking tool. Everyone in the arts, and I mean *everyone*, uses Instagram, and you're a pariah if you don't have it. On my old device I already had Meta apps cordoned in their own little naughty corner, but with the greater control Graphene offers the user, I was able to isolate them into a profile with no Google Play services, no cell-service access, no location access, and no microphone access. I kept camera access on a manual toggle just in case.

## Roadbumps

Overall the process was very clean! Notably, though, I had a few apps that didn't work, as well as issues with cell service.

### Fickle apps

Some apps *hate* the idea of running in an environment without Google Play services, and required special workarounds in order to function.

Two apps were so fickle that I wasn't able to get them working at all. One of them was CashApp, which uses some proprietary authentication methods to allow you into the app. I could get as far as installing the app, booting it, and logging most of the way in, but just before I could open the app, I got an error saying they couldn't verify that my account belonged to me. I suspect it's because of a check on the operating system. I'm still able to access other quick-exchange apps, so I'm not *too* hurt by the loss.

The other stubborn specimen is ð• the Everything Appâ„¢Â©Â®â„ â„—Â©â„¢, which I still occasionally use as outreach for an app I develop. Their crackdown on [third-party clients](https://twistedvoxel.com/massive-ban-wave-targets-oldtweetdeck-users-following-xs-crackdown-on-third-party-access) and [API access](https://www.engadget.com/twitter-shut-off-its-free-api-and-its-breaking-a-lot-of-apps-222011637.html) also came with stringent client verification on their first-party app. Even with Play services enabled, the app wouldn't let me through. They've done a great job taking a thorough approach to cracking down on this; let's hope we see them take this energy to cracking down on the rampant [hate speech](https://news.berkeley.edu/2025/02/13/study-finds-persistent-spike-in-hate-speech-on-x), [white supremacy](https://archive.is/xTFKl), and [non-consensual AI-generated porn](https://archive.is/xTFKl) on the platform, too!

### Adding my SIM card

Controversial take: one of the most important parts of having a phone is the ability to make calls. Stock Android has a functionality where you can transfer your eSIM from one device to another within the setup process, which is awesome and super helpful and, unfortunately, one of the many things GrapheneOS removes in its mission to Improve Security. The Pixel 10 Pro also, unfortunately, plays into the wider industry trend of removing hardware features, and "courageously" removed the physical SIM port[^5]. This left me with one other option: scanning a QR code containing the info for my eSIM, meaning I had to... *call my carrier.*

The issue I had is moreso a carrier-support one than a Graphene one, but I'm still gonna whine about it. When I called their support line, after some verification of my identity, I explained my situation and how the eSIM transfer tool built into Pixels wouldn't work for my use case. I don't think the support agent understood me, though, as he suggested a total of *six times* to just use the built-in transfer tool with Pixels (the one Graphene removed). I requested to be transferred to a different agent, who suggested the tool three more times. After being transferred to a third agent, who only asked once, then accepted my explanation that I couldn't use the tool and sent a QR code over. This took a total of about 25 minutes on the phone.

After my SIM was ported over, I had an issue where my phone could only receive 2G service for about twelve hours, which is standard when doing a manual SIM transfer. Patient waiting and a few restarts fixed the issue and I haven't had problems since.

## Overview
I've been using GrapheneOS as my daily driver for about two weeks now, and I'm happy to report I have no desire to switch back! Usually, I mentally percieve a switch to a free version of an app as having a post-install cost, either in relearning software or in added inconvenience through missing features. Aside from the cases I've already mentioned, notably no tap-to-pay, no support for a few apps, and a self-inflicted extra step for installing apps, my user experience with Graphene has been basically identical.





[^1]: ...except for the fact Proton can occasionally be pretty lackluster as a steward of their software. Proton Mail is their primary product with twelve years of maturity and they *still* don't have profile pictures, contacts, or F-Droid support?

[^2]: Pixels offer the cleanest stock-Android experience but also *so much unnecessary AI stuff* in every facet of the user experience. I'm not entirely against the controlled use of LLMs specifically for some tasks, but the key operator is *controlled* use and not [the billion ways Google throws it into everything on the Pixels](https://archive.is/Nwxfe) in lieu of actual improved processor power and battery life.

[^3]: At least for like, a few months, unless my state keeps getting weirder about trans people. Knock on wood.

[^4]: ...in the U.S., where our primary option is Google Wallet. Google runs a hash to see if you're running a version of Android they find acceptable. Graphene is not acceptable. *Some* places with proprietary solutions will allow it if you use theirs. In Europe, you can use [Curve Pay](https://www.curve.com). I personally see this as a win; adding friction to purchases seems nice.

[^5]: For my use-case, which doesn't involve a lot of international travel, this is probably not a huge deal. I'd like the option for hypothetical international travel, but an eSIM for my primary is more secure anyways.

[^6]: Side-note: Google, by default, tracks and *indefinitely stores* your location if you have Google Maps installed. That sounds like paranoid ramblings but it's a documented feature of theirs. If you haven't already, [disable the Timeline feature on your account!](https://support.google.com/maps/answer/6258979?hl=en&co=GENIE.Platform%3DAndroid)

[^7]: Free as in freedom, not free as in beer. Aurora Store does *not* enable piracy.
