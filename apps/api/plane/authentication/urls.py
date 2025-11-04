from django.urls import path

from .views import (
    CSRFTokenEndpoint,
    ForgotPasswordEndpoint,
    SetUserPasswordEndpoint,
    ResetPasswordEndpoint,
    ChangePasswordEndpoint,
    # App
    EmailCheckEndpoint,
    GitLabCallbackEndpoint,
    GitLabOauthInitiateEndpoint,
    GitHubCallbackEndpoint,
    GitHubOauthInitiateEndpoint,
    GoogleCallbackEndpoint,
    GoogleOauthInitiateEndpoint,
    MagicGenerateEndpoint,
    MagicSignInEndpoint,
    MagicSignUpEndpoint,
    SignInAuthEndpoint,
    SignOutAuthEndpoint,
    SignUpAuthEndpoint,
)

urlpatterns = [
    # credentials
    path("sign-in/", SignInAuthEndpoint.as_view(), name="sign-in"),
    path("sign-up/", SignUpAuthEndpoint.as_view(), name="sign-up"),
    # signout
    path("sign-out/", SignOutAuthEndpoint.as_view(), name="sign-out"),
    # csrf token
    path("get-csrf-token/", CSRFTokenEndpoint.as_view(), name="get_csrf_token"),
    # Magic sign in
    path("magic-generate/", MagicGenerateEndpoint.as_view(), name="magic-generate"),
    path("magic-sign-in/", MagicSignInEndpoint.as_view(), name="magic-sign-in"),
    path("magic-sign-up/", MagicSignUpEndpoint.as_view(), name="magic-sign-up"),
    ## Google Oauth
    path("google/", GoogleOauthInitiateEndpoint.as_view(), name="google-initiate"),
    path("google/callback/", GoogleCallbackEndpoint.as_view(), name="google-callback"),
    ## Github Oauth
    path("github/", GitHubOauthInitiateEndpoint.as_view(), name="github-initiate"),
    path("github/callback/", GitHubCallbackEndpoint.as_view(), name="github-callback"),
    ## Gitlab Oauth
    path("gitlab/", GitLabOauthInitiateEndpoint.as_view(), name="gitlab-initiate"),
    path("gitlab/callback/", GitLabCallbackEndpoint.as_view(), name="gitlab-callback"),
    # Email Check
    path("email-check/", EmailCheckEndpoint.as_view(), name="email-check"),
    # Password
    path("forgot-password/", ForgotPasswordEndpoint.as_view(), name="forgot-password"),
    path(
        "reset-password/<uidb64>/<token>/",
        ResetPasswordEndpoint.as_view(),
        name="forgot-password",
    ),
    path("change-password/", ChangePasswordEndpoint.as_view(), name="forgot-password"),
    path("set-password/", SetUserPasswordEndpoint.as_view(), name="set-password"),
]
